# -*- encoding: utf-8 -*-
# Author: BISPRO
# License AGPL-3.0 or later (https://bispro.vn).

from odoo import api, models, _
from odoo.exceptions import UserError
import json


class ReportProductRegisters(models.AbstractModel):
    _name = 'report.product_registers'

    def _get_query(self, data):
        """
        Build query for get product register
        :param data: contain parameters for query get
        :return: query string and it's params
        """
        query = """
        SELECT	t.id as id,
                t.default_code as code,
                t."name" as name,
                u."name" as unit_uom,
                CASE t."type"
                    WHEN 'product' THEN 'Storable Product'
                    WHEN 'consu' THEN 'Consumable'
                    WHEN 'service' THEN 'Service'
                ELSE t."type" END as product_type,
                t.categ_id,
                c.complete_name as categ_name,
                t.list_price as sale_price,
                t.weight,
                t.volume,
                t.sale_ok,
                t.purchase_ok,
                CASE WHEN t.active THEN 'Active'
                    ELSE 'Inactive'
                END as flag               
        FROM product_template t
            LEFT JOIN product_category c ON t.categ_id = c.id
            LEFT JOIN uom_uom u ON t.uom_id = u.id
        WHERE 1 = %s"""
        params = [1]
        if data['form'].get('product_flag') == 'Active':
            query += " AND t.active = true"
        elif data['form'].get('product_flag') == 'Inactive':
            query += " AND t.active = false"
        categ_ids = []
        if data['form'].get('categories', False):
            for i in data['form'].get('categories'):
                categ = self.env['product.category'].browse(int(i.get('id')))
                categ_ids.append(categ.id)
                if categ.child_id:
                    categ_ids += categ.child_id.ids
            query += " AND c.id in %s"
            params += [tuple(categ_ids)]
        if data['form'].get('product_type', 'all') != 'all':
            query += """ AND t."type" = %s"""
            params += [data['form'].get('product_type'), ]
        return query, params

    @api.model
    def get_report_values(self, docids, data=None):
        if not data.get('form'):
            raise UserError(_("Form content is missing, this report cannot be printed."))

        template_obj = self.env['product.template']
        product_obj = self.env['product.product']
        query, params = self._get_query(data)
        self.env.cr.execute(query, tuple(params))
        product_templates = self.env.cr.dictfetchall()
        # product_templates = sorted(product_templates, key=lambda x: (x.get('code')))
        is_show_attribute = data['form'].get('is_show_attribute')
        lines_op = []
        for template in product_templates:
            template_id = template_obj.browse(template['id'])
            # template['main'] = True
            template['main_id'] = "line{}".format(template_id.id)
            template['cost'] = template_id.standard_price
            # template['show_attribute'] = is_show_attribute
            if is_show_attribute:
                products = product_obj.search([('product_tmpl_id', '=', template_id.id)])
                if len(products):
                    template['has_children'] = True
                else:
                    template['has_children'] = False
                children = []
                for product in products:
                    children.append({
                        # 'main': False,
                        'parent': "line{}".format(template_id.id),
                        'code': product.default_code,
                        'short_name': product.barcode or '',
                        'unit_uom': product.uom_id.name,
                        'cost': product.standard_price,
                        'sale_price': product.list_price,
                        'weight': product.weight,
                        'volume': product.volume,
                        'flag': 'Active' if product.active else 'Inactive'
                    })
                template['children'] = children
            lines_op.append(template)

        return {
            'data': data,
            'lines': lines_op,
        }

    def prepare_local_ctx(self, docids, data=None):
        data = ({'form': data})
        used_context = {}
        lang_code = self.env.context.get('lang') or 'vi_VN'
        lang = self.env['res.lang']
        lang_id = lang._lang_get(lang_code)

        used_context['symbol'] = self.env.user.company_id.currency_id.symbol
        used_context['date_format'] = lang_id.date_format
        used_context['time_format'] = lang_id.time_format
        # used_context['categories'] = data['form']['categories']
        # used_context['product_flag'] = data['form']['product_flag']
        # used_context['product_type'] = data['form']['product_type']
        # used_context['show_attribute'] = data['form']['is_show_attribute']

        data['form']['used_context'] = used_context
        return docids, data

    @api.model
    def action_view(self, docids, data=None):
        docids, data = self.prepare_local_ctx(docids, data)
        report_vals = self.get_report_values(docids, data)
        return json.dumps(report_vals)

    @api.model
    def action_xlsx(self, docids, data=None):
        docids, data = self.prepare_local_ctx(docids, data)
        report_vals = self.get_report_values(docids, data)
        return report_vals
