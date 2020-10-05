/*
# -*- encoding: utf-8 -*-
# Author: BISPRO
*/

odoo.define('bispro_partner_report_web.Partner_Registers', function (require) {
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

    var PartnerRegistersMain = AbstractAction.extend({
        template:'PartnerRegistersMain',

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            new ControlButtons(this).appendTo(this.$('.B2B_ControlSection'));
            new UserFilters(this).appendTo(this.$('.B2B_ReportFiltersSection'));
        }, //start

    }); //PartnerRegistersMain

    var ControlButtons = Widget.extend({
        template:'PartnerRegistersControlButtons',
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

        download_xlsx : function(event){
            var self = this;
            $("#filter_button").toggle();
            $("#xlsx_button").toggle();
            $('#loader').css({'visibility':'visible'});

            var filter = self.get_filter_datas();

            return rpc.query({
                    args: [[],filter],
                    model: 'report.partner_registers',
                    method: 'action_xlsx',
                })
                .then(function(result){
                    $("#filter_button").toggle();
                    $("#xlsx_button").toggle();
                    $('#loader').css({'visibility':'hidden'});
                    var action = {
                        'type': 'ir.actions.report',
                        'name':'Partner Registers',
                        'model':'report.bispro_partner_report_web.partner_registers_xlsx',
                        'report_type': 'xlsx',
                        'report_name': 'bispro_partner_report_web.partner_registers_xlsx',
                        'report_file': 'partner_registers',
                        'data': result,
                        'context': {'active_model':'report.partner_registers',
                                    'data': []},
                        'display_name': 'Partner Registers',
                    };
                    return web_client.do_action(action);
                });
        },

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
                    model: 'report.partner_registers',
                    method: 'action_view',
                }).then(function(result){
                    $(".B2B_ReportDataSection").empty();
                    $("#filter_button").toggle();
                    $("#xlsx_button").toggle();
                    new PartnerRegistersContents(this,result).appendTo($(".B2B_ReportDataSection"));
                });
        },

        get_filter_datas : function(){
            var self = this;
            var output = {}

            // Get Partner Category
            output.categories = $(".partner-category-multiple").select2('data')
            // Get Status Flag checkboxes
            output.activate_flag = 'all'
            if ($("#active").is(':checked')){ // Active Partners
                output.activate_flag = 'Active';
            }
            if ($("#in_active").is(':checked')){ // Inactive Partners
                output.activate_flag = 'Inactive';
            }
            // Get Partner Type selected
            var type_selection = $(".dynamic-type-multiple").select2('data')
            output.partner_type = type_selection.id
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
        template:'PartnerRegistersUserFilters',

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            var self = this;
            var id = session.uid;

            // No need to fetch from DB. Just templates
            self.$el.append(QWeb.render('PartnerType'));
            self.$el.find('.dynamic-type-multiple').select2({
                placeholder:_t('Select partner type ...'),
                minimumResultsForSearch: 5
            }).val('all').trigger('change');

            // Getting categories from partner category master
            var categories = [];
            rpc.query({
                model: 'res.partner.category',
                method: 'search_read',
                args: []
                }).then(function (results) {
                    _(results).each(function (item) {
                        categories.push({'name':item.name, 'id':item.id, 'code':item.code})
                    }) //each
                    self.$el.append(QWeb.render('PartnerTags', {'categories': categories}));
                    self.$el.find('.partner-category-multiple').select2({
                    placeholder:_t('Select Tags ...'),
                    minimumResultsForSearch: 5,
                    }).val('').trigger('change');
                }); //query
        }, //start

    }); //UserFilters

    var PartnerRegistersContents = Widget.extend({
        template:'PartnerRegistersContents',

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

    core.action_registry.add('partner_registers_report', PartnerRegistersMain);

    return PartnerRegistersMain;
});
