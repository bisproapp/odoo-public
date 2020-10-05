# -*- coding: utf-8 -*-
# Author: BISPRO

from odoo import api, models, _
from odoo.exceptions import UserError
import json


class ReportEmployeeRegisters(models.AbstractModel):
    _name = 'report.employee_registers'

    def _get_query(self, data):
        """
        Build query for get employee register
        :param data: contain parameters for query get
        :return: query string and it's params
        """
        query = """
        SELECT  a.id as      code,
                a."name" as full_name,
                a.gender,
                a.birthday,
                hd."name" as department,
                hj."name" as job_title,
                b."name" as country,
                rp.street,
                CASE WHEN a.active THEN 'Active'
                    ELSE 'Inactive'
                END activate_flag,
                a.create_date
        FROM    hr_employee a
            LEFT JOIN res_country b ON a.country_id = b.id
            LEFT JOIN hr_department hd ON a.department_id = hd.id
            LEFT JOIN hr_job hj ON a.job_id = hj.id
            LEFT JOIN res_partner rp ON a.address_home_id = rp.id
        WHERE   1 = 1"""
        params = []
        # add activate parameter
        if data['form'].get('activate_flag') == 'Active':
            query += " AND a.active = true"
        elif data['form'].get('activate_flag') == 'Inactive':
            query += " AND a.active = false"
        categ_ids = []
        if data['form'].get('categories', False):
            for i in data['form'].get('categories'):
                categ = self.env['hr.job'].browse(int(i.get('id')))
                categ_ids.append(categ.id)
            query += " AND hj.id in %s"
            params += [tuple(categ_ids)]
        return query, params

    @api.model
    def get_report_values(self, docids, data=None):
        if not data.get('form'):
            raise UserError(_("Form content is missing, this report cannot be printed."))
        query, params = self._get_query(data)
        self.env.cr.execute(query, tuple(params))
        employees = self.env.cr.dictfetchall()
        employees = sorted(employees, key=lambda x: (x.get('code') or '', x.get('full_name') or ''))

        return {
            'data': data,
            'lines': employees,
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
        used_context['categories'] = data['form']['categories']
        data['form']['used_context'] = used_context
        return docids, data

    @api.model
    def action_view(self, docids, data=None):
        docids, data = self.prepare_local_ctx(docids, data)
        report_vals = self.get_report_values(docids, data)
        json.JSONEncoder.default = lambda self, obj: (obj.isoformat() if hasattr(obj, 'isoformat') else obj)
        return json.dumps(report_vals)

    # @api.model
    # def action_xlsx(self, docids, data=None):
    #     docids, data = self.prepare_local_ctx(docids, data)
    #     report_vals = self.get_report_values(docids, data)
    #     return report_vals

