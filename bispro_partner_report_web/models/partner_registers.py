# -*- encoding: utf-8 -*-
# Author: BISPRO
# License AGPL-3.0 or later (https://bispro.vn).

from odoo import api, models, _
from odoo.exceptions import UserError
import json


class ReportPartnerRegisters(models.AbstractModel):
    _name = 'report.partner_registers'

    def _get_query(self, data):
        """
        Build query for get partner register
        :param data: contain parameters for query get
        :return: query string and it's params
        """
        query = """
        SELECT  a."ref" as code,
                a."name" as full_name,
                a.street as address,
                a.city as city,
                b."name" as province,
                c."name" as country,
                a.vat as vat,
                a.phone as phone,
                a.mobile as mobile,
                a.email as email,
                a.customer_rank,
                a.supplier_rank,
                a.is_company,
                d."name" as team,
                pc."name" as category,
                CASE WHEN a.active THEN 'Active'
                    ELSE 'Inactive'
                END activate_flag,
                a.create_date
        FROM    res_partner a
            LEFT JOIN res_country_state b ON a.state_id = b.id
            LEFT JOIN res_country c ON a.country_id = c.id
            LEFT JOIN crm_team d on a.team_id = d.id
            LEFT JOIN res_partner_res_partner_category_rel r on a.id = r.partner_id
            LEFT JOIN res_partner_category pc on r.category_id = pc.id
        WHERE   1 = 1"""
        params = []
        # add activate parameter
        if data['form'].get('activate_flag') == 'Active':
            query += " AND a.active = true"
        elif data['form'].get('activate_flag') == 'Inactive':
            query += " AND a.active = false"
        # add customer/supplier parameter
        # if data['form'].get('partner_type') == 'all':
        #     query += " AND a.customer_rank > 0 OR a.supplier_rank > 0"
        # elif data['form'].get('partner_type') == 'customer':
        #     query += " AND a.customer_rank > 0"
        # else:
        #     query += " AND a.supplier_rank > 0"
        # add partner category parameter
        categ_ids = []
        if data['form'].get('categories', False):
            for i in data['form'].get('categories'):
                categ = self.env['res.partner.category'].browse(int(i.get('id')))
                categ_ids.append(categ.id)
                if categ.child_ids:
                    categ_ids += categ.child_ids.ids
            query += " AND pc.id in %s"
            params += [tuple(categ_ids)]
        return query, params

    @api.model
    def get_report_values(self, docids, data=None):
        if not data.get('form'):
            raise UserError(_("Form content is missing, this report cannot be printed."))
        query, params = self._get_query(data)
        self.env.cr.execute(query, tuple(params))
        partners = self.env.cr.dictfetchall()
        partners = sorted(partners, key=lambda x: (x.get('code') or '', x.get('full_name') or ''))

        return {
            'data': data,
            'lines': partners,
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
        # used_context['company'] = data['form']['company']
        # used_context['categories'] = data['form']['categories']
        data['form']['used_context'] = used_context
        return docids, data

    @api.model
    def action_view(self, docids, data=None):
        docids, data = self.prepare_local_ctx(docids, data)
        report_vals = self.get_report_values(docids, data)
        json.JSONEncoder.default = lambda self, obj: (obj.isoformat() if hasattr(obj, 'isoformat') else obj)
        return json.dumps(report_vals)


