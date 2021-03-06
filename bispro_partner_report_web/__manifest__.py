# -*- coding: utf-8 -*-
#############################################################################
#
#    bispro.vn.
#
#    Copyright (C) 2020 bispro.vn(<http://bispro.vn)
#    Author: bispro.vn (<http://bispro.vn)
#
#    You can modify it under the terms of the GNU LESSER
#    GENERAL PUBLIC LICENSE (LGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU LESSER GENERAL PUBLIC LICENSE (LGPL v3) for more details.
#
#    You should have received a copy of the GNU LESSER GENERAL PUBLIC LICENSE
#    (LGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
#############################################################################

{
    'name': 'BISPRO Partner Report Web',
    'version': '14.0.0.0.1',
    'category': 'Sales',
    'summary': 'Show report web',
    'description': """
BISPRO Base customize and modify:
=========================
This module is bispro base module used to all bispro project technology

Key Features
------------
* Base report setting and functions for query and show web report
""",
    'author': 'BISPRO.VN,',
    'website': 'https://bispro.vn',
    'depends': [],
    'images': ["static/description/icon.png"],
    'data': [
        'views/assets.xml',
        'views/base_report_views.xml',
    ],
    'qweb': [
        'static/src/xml/report_partner_registers.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
    'license': 'AGPL-3',
}
