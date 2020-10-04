# -*- coding: utf-8 -*-
# Author: Duongnv
# License AGPL-3.0 or later (https://b2btech.com.vn).

{
    'name': 'B2B HR Employee Report',
    'version': '14.0.0.0.0',
    'category': 'B2B Base',
    'summary': 'B2B Base Report Setting',
    'description': """
B2B Base customize and modify:
=========================
This module is b2b base module used to all b2b project technology

Key Features
------------
* Base report setting and functions for query and show web report
* It's also support to export data to Excel file.
""",
    'author': 'B2B Technology, DuongNV,',
    "website": "https://b2btech.com.vn",
    'depends': [
    ],
    'data': [
        'views/assets.xml',
        'views/base_report_views.xml',
    ],
    'qweb': [
        'static/src/xml/report_employee_registers.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
    'license': 'AGPL-3',
}
