/*
# -*- encoding: utf-8 -*-
# Author: BISPRO
# License AGPL-3.0 or later (https://bispro.vn).
*/

odoo.define('bispro_product_report_web.Product_Registers', function (require) {
    'use strict';

    var ActionManager = require('web.ActionManager');
    var data = require('web.data');
    var Dialog = require('web.Dialog');
    var FavoriteMenu = require('web.FavoriteMenu');
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

    var ProductRegistersMain = AbstractAction.extend({
        template:'ProductRegistersMain',

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            new ControlButtons(this).appendTo(this.$('.B2B_ControlSection'));
            new UserFilters(this).appendTo(this.$('.B2B_ReportFiltersSection'));
        }, //start

    }); //ProductRegistersMain

    var ControlButtons = Widget.extend({
        template:'ProductRegistersControlButtons',
        events: {
            'click #filter_button': 'filter_button_click',
            'click #apply_button': 'apply_button_click',
            'click #expand_all': 'apply_button_expand_all',
            'click #merge_all': 'apply_button_merge_all',
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

        apply_button_expand_all : function(event){
            $('.product-attribute').collapse('show');
        },

        apply_button_merge_all : function(event){
            $('.product-attribute').collapse('hide');
        },

        download_xlsx : function(event){
            var self = this;
            $("#filter_button").toggle();
            $("#xlsx_button").toggle();
            $("#expand_all").toggle();
	        $("#merge_all").toggle();
            $('#loader').css({'visibility':'visible'});

            var filter = self.get_filter_datas();

            return rpc.query({
                    args: [[],filter],
                    model: 'report.product_registers',
                    method: 'action_xlsx',
                })
                .then(function(result){
                    $("#filter_button").toggle();
                    $("#xlsx_button").toggle();
                    $("#expand_all").toggle();
                    $("#merge_all").toggle();
                    $('#loader').css({'visibility':'hidden'});
                    var action = {
                        'type': 'ir.actions.report',
                        'name':'Product Registers',
                        'model':'report.b2b_base_report.product_registers_xlsx',
                        'report_type': 'xlsx',
                        'report_name': 'b2b_base_report.product_registers_xlsx',
                        'report_file': 'product_registers',
                        'data': result,
                        'context': {'active_model':'report.product_registers',
                                    'data': []},
                        'display_name': 'Product Registers',
                    };
                    return web_client.do_action(action);
                });
        },

        apply_button_click : function(event){
            var self = this;
            $("#filter_button").toggle();
            $("#xlsx_button").toggle();
            $("#expand_all").toggle();
            $("#merge_all").toggle();
            $('#loader').css({'visibility':'visible'});
            var filter = self.get_filter_datas();

            // Hide filter sections when apply filter button
            $(".b2b_base_report_filter").slideToggle("slow",function(){
                $("#apply_button").toggle();
            });

            var final_html = rpc.query({
                    args: [[],filter],
                    model: 'report.product_registers',
                    method: 'action_view',
                }).then(function(result){
                    $(".B2B_ReportDataSection").empty();
                    $("#filter_button").toggle();
                    $("#xlsx_button").toggle();
                    $("#expand_all").toggle();
                    $("#merge_all").toggle();
                    new ProductRegistersContents(this,result).appendTo($(".B2B_ReportDataSection"));
                });
        },

        get_filter_datas : function(){
            var self = this;
            var output = {}

            // Get Product Category
            output.categories = $(".product-category-multiple").select2('data')
            // Get Status Flag checkboxes
            output.product_flag = 'all'
            if ($("#active").is(':checked')){ // Active Products
                output.product_flag = 'Active';
            }
            if ($("#in_active").is(':checked')){ // Inactive Products
                output.product_flag = 'Inactive';
            }
            // Get Product Type selected
            var product_type = $(".dynamic-type-multiple").select2('data')
            output.product_type = product_type.id
//            if (Array.isArray(product_type))
//                output.product_type = product_type[0].id
//            else
//                output.product_type = product_type.id
            // Get Excel Show Attribute
            output.is_show_attribute = $("#show-attribute").is(':checked')

            return output
        },

    }); //ControlButtonsPlg

    var UserFilters = Widget.extend({
        template:'ProductRegistersUserFilters',
//        events: {
//            'change .filter-by-multiple': 'change_filter'
//        },
//
//        change_filter : function(event){
//            if($(".filter-by-multiple").select2('data')[0]){
//                var selection_filter = $(".filter-by-multiple").select2('data')[0].id;
//            }
//        },

        init : function(view, code){
            this._super(view, code);
        },

        start : function(){
            var self = this;
            var id = session.uid;

            // No need to fetch from DB. Just templates
            self.$el.append(QWeb.render('ProductType'));
            self.$el.find('.dynamic-type-multiple').select2({
                placeholder:_t('Select product type ...'),
                minimumResultsForSearch: 5
            }).val('all').trigger('change');
            // Getting categories from product category master
            var categories = [];
            rpc.query({
                model: 'product.category',
                method: 'search_read',
                args: []
                }).then(function (results) {
                    _(results).each(function (item) {
                        categories.push({'name':item.name, 'id':item.id, 'code':item.code})
                    }) //each
                    self.$el.append(QWeb.render('CategoryLines', {'categories': categories}));
                    self.$el.find('.product-category-multiple').select2({
                    placeholder:_t('Select Category ...'),
                    minimumResultsForSearch: 5,
                    }).val('').trigger('change');
                }); //query
        }, //start

    }); //UserFilters

    var ProductRegistersContents = Widget.extend({
        template:'ProductRegistersContents',

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

    }); //ProductRegistersContents

    core.action_registry.add('product_registers_report', ProductRegistersMain);

    return ProductRegistersMain;
});

