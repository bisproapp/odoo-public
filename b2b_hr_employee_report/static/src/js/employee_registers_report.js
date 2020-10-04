/*
# -*- encoding: utf-8 -*-
# Author: Lã Tuấn Kiệt
# Copyright © 2017 B2B Technology
# License AGPL-3.0 or later (https://b2btech.com.vn).
*/

odoo.define('b2b_base_report.Employee_Registers', function (require) {
    'use strict';

    var ActionManager = require('web.ActionManager');
    var data = require('web.data');
    var Dialog = require('web.Dialog');
    var FavoriteMenu = require('web.FavoriteMenu');
    // var ViewManager = require('web.ViewManager');
    var web_client = require('web.web_client');
    var ajax = require('web.ajax');

    var AbstractAction = require('web.AbstractAction');
    var core = require('web.core');
    var Widget = require('web.Widget');
    var session = require('web.session');
    var rpc = require('web.rpc');
    var field_utils = require('web.field_utils');
    var utils = require('web.utils');
    var round_di = utils.round_decimals;

    var _t = core._t;
    var QWeb = core.qweb;

    var EmployeeRegistersMain = AbstractAction.extend({
        template:'EmployeeRegistersMain',

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            new ControlButtons(this).appendTo(this.$('.B2B_ControlSection'));
            new UserFilters(this).appendTo(this.$('.B2B_ReportFiltersSection'));
        }, //start

    }); //PartnerRegistersMain

    var ControlButtons = Widget.extend({
        template:'EmployeeRegistersControlButtons',
        events: {
            'click #filter_button': 'filter_button_click',
            'click #apply_button': 'apply_button_click',
            'click #xlsx_button': 'download_xlsx',
        },

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            var self = this;
            //$("#expand_all").toggle();
            //$("#merge_all").toggle();
        }, //start

        filter_button_click : function(event){
            $(".b2b_base_report_filter").slideToggle("slow",function(){
                $("#apply_button").toggle();
            });
        },

//        download_xlsx : function(event){
//            var self = this;
//            $("#filter_button").toggle();
//            $("#xlsx_button").toggle();
//            $('#loader').css({'visibility':'visible'});
//
//            var filter = self.get_filter_datas();
//
//            return rpc.query({
//                    args: [[],filter],
//                    model: 'report.employee_registers',
//                    method: 'action_xlsx',
//                })
//                .then(function(result){
//                    $("#filter_button").toggle();
//                    $("#xlsx_button").toggle();
//                    $('#loader').css({'visibility':'hidden'});
//                    var action = {
//                        'type': 'ir.actions.report',
//                        'name':'Employee Registers',
//                        'model':'report.b2b_hr_employee_report.employee_registers_xlsx',
//                        'report_type': 'xlsx',
//                        'report_name': 'b2b_hr_employee_report.employee_registers_xlsx',
//                        'report_file': 'employee_registers',
//                        'data': result,
//                        'context': {'active_model':'report.employee_registers',
//                                    'data': []},
//                        'display_name': 'Employee Registers',
//                    };
//                    return web_client.do_action(action);
//                });
//        },

        apply_button_click : function(event){
            var self = this;
            $("#filter_button").toggle();
            $("#xlsx_button").toggle();
            $('#loader').css({'visibility':'visible'});
            var filter = self.get_filter_datas();

            // Hide filter sections when apply filter button
            $(".b2b_base_report_filter").slideToggle("slow",function(){
                $("#apply_button").toggle();
            });

            var final_html = rpc.query({
                    args: [[],filter],
                    model: 'report.employee_registers',
                    method: 'action_view',
                }).then(function(result){
                    $(".B2B_ReportDataSection").empty();
                    $("#filter_button").toggle();
                    $("#xlsx_button").toggle();
                    new EmployeeRegistersContents(this,result).appendTo($(".B2B_ReportDataSection"));
                });
        },

        get_filter_datas : function(){
            var self = this;
            var output = {}

            // Get Employee Category
            output.categories = $(".employee-category-multiple").select2('data')
            // Get Status Flag checkboxes
            output.activate_flag = 'all'
            if ($("#active").is(':checked')){ // Active Partners
                output.activate_flag = 'Active';
            }
            if ($("#in_active").is(':checked')){ // Inactive Partners
                output.activate_flag = 'Inactive';
            }
            // Get Employee Type selected
            var type_selection = $(".dynamic-type-multiple").select2('data')
            output.employee_type = type_selection.id
//            if (type_selection == 'customer'){
//                output.customer = true;
//            }
//            if (type_selection == 'supplier'){
//                output.supplier = true;
//            }
            return output
        },

    }); //ControlButtonsPlg

    var UserFilters = Widget.extend({
        template:'EmployeeRegistersUserFilters',

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            var self = this;
            var id = session.uid;

            // No need to fetch from DB. Just templates
            self.$el.append(QWeb.render('EmployeeType'));
            self.$el.find('.dynamic-type-multiple').select2({
                placeholder:_t('Select partner type ...'),
                minimumResultsForSearch: 5
            }).val('all').trigger('change');
            // Getting categories from partner category master
            var categories = [];
            rpc.query({
                model: 'hr.job',
                method: 'search_read',
                args: []
                }).then(function (results) {
                    _(results).each(function (item) {
                        categories.push({'name':item.name, 'id':item.id, 'code':item.code})
                    }) //each
                    self.$el.append(QWeb.render('EmployeeTags', {'categories': categories}));
                    self.$el.find('.employee-category-multiple').select2({
                    placeholder:_t('Select Job ...'),
                    minimumResultsForSearch: 5,
                    }).val('').trigger('change');
                }); //query
        }, //start

    }); //UserFilters

    var EmployeeRegistersContents = Widget.extend({
        template:'EmployeeRegistersContents',

        init : function(view, code){
            this._super(view, code);
            this.result = JSON.parse(code); // To convert string to JSON
        },

        start : function(){
            var self = this;
            $('#loader').css({'visibility':'hidden'});
        }, //start

        format_number: function(number, precision){
            var decimals = precision;
            if (typeof number === 'number') {
                number = round_di(number,decimals).toFixed(decimals);;
                number = field_utils.format.float(round_di(number, decimals), { type: 'float', digits: [69, decimals]});
            }
            return number;
        },

    }); //PartnerRegistersContents

    core.action_registry.add('employee_registers_report', EmployeeRegistersMain);

    return EmployeeRegistersMain;
});
