/**
 * @author vagrant
 */
Ext.require('Ext.data.Store');

// Create data store for tables of mean bias
Ext.create('Ext.data.Store', {
    storeId: 'simpsonsStore',
    fields: ['name', 'email', 'phone'],
    data: {
        'items': [{
            'name': 'Lisa',
            "email": "lisa@simpsons.com",
            "phone": "555-111-1224"
        }, {
            'name': 'Bart',
            "email": "bart@simpsons.com",
            "phone": "555-222-1234"
        }, {
            'name': 'Homer',
            "email": "home@simpsons.com",
            "phone": "555-222-1244"
        }, {
            'name': 'Marge',
            "email": "marge@simpsons.com",
            "phone": "555-222-1254"
        }]
    },
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'items'
        }
    }
});

Ext.define('Evaluator.model.BalanceStatistics', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'sample', 'treated',
        'control', 'bias', 'biasr', 't', 'pt'],
    proxy: {
        type: 'ajax',
        url: '/tables/cbsmeans/',
        reader: {
            type: 'json'
        }
    }
});

var balanceStatistics = Ext.create('Ext.data.Store', {
    storeId: 'testore',
    model: 'Evaluator.model.BalanceStatistics',
    autoLoad: false
});

//Create functions to handle value rendering for charts
/** Takes a value and formats it as a percentage to two decimal places */
function percent(value, metadata, record) {
    return [parseFloat(value * 100).toFixed(2), '%'].join('');
}

function tipsRenderer(storeItem, item) {
    this.setTitle(storeItem.get('name') + ':' + storeItem.get('bias'));
}

function seriesRenderer(storeItem, item, barAttr, i, store) {
    var colors = ['blue', 'yellow'];
    barAttr.fill = colors[i % colors.length];
    return barAttr;
}

//Create chart components
var balanceStatisticsChartAxes = [{
    title: 'Percent Bias',
    type: 'Numeric',
    position: 'left',
    fields: ['bias'],
    label: {
        renderer: percent
    },
    grid: true
},
    {
        type: 'Category',
        position: 'bottom',
        fields: ['name'],
        title: 'Covariates'
    }];

var balanceStatisticsChartSeries = [{
    type: 'column',
    axis: 'left',
    style: {
        fillOpacity: 0.8
    },
    highlight: true,
    renderer: seriesRenderer,
    tips: {
        trackMouse: true,
        width: 140,
        height: 28,
        renderer: tipsRenderer
    },
    label: {
        display: 'insideEnd',
        'text-anchor': 'middle',
        field: 'bias',
        renderer: percent,
        orientation: 'vertical',
        color: '#333'
    },
    xField: 'name',
    yField: 'bias'
}];

var balanceStatisticsChart = {
    xtype: 'chart',
    width: 400,
    maxHeight: 300,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    animate: true,
    style: {background: 'white'},
    store: balanceStatistics,
    axes: balanceStatisticsChartAxes,
    series: balanceStatisticsChartSeries
};

var balanceStatisticsPanel = {
    xtype: 'gridpanel',
    title: 'Balance Statistics',
    store: Ext.data.StoreManager.lookup('testore'),
    columns: [{
        text: 'Variable',
        dataIndex: 'name'
    }, {
        text: 'Sample',
        dataIndex: 'sample',
        flex: 1
    }, {
        text: 'Treated',
        dataIndex: 'treated'
    }, {
        text: 'Control',
        dataIndex: 'control',
        flex: 1
    }, {
        text: '% Bias',
        dataIndex: 'bias'
    }, {
        text: '% Bias Reduction',
        dataIndex: 'biasr',
        flex: 1
    }, {
        text: 't',
        dataIndex: 't'
    }, {
        text: 'p > t',
        dataIndex: 'pt',
        flex: 1
    }]
};

Ext.define('Evaluator.view.CBS', {
    extend: 'Ext.window.Window',
    alias: 'widget.cbs',
    title: 'Check Balance Statistics',
    minHeight: '640',
    width: 800,
    layout: 'fit',
    initComponent: function () {
        // Create data store for chart of menu bias
        balanceStatistics.load();

        this.dockedItems = [{
            xtype: 'tabpanel',
            items: [{
                title: 'Balance Statistics',
                minHeight: '640',
                layout: {
                    type: 'fit',
                    align: 'stretch'
                },
                defaults: {
                    flex: 1
                },
                items: [{
                    xtype: 'container',
                    maxHeight: 300,
                    layout: {type: 'vbox', align: 'stretch'},
                    defaults: {flex: 1},
                    items: [balanceStatisticsChart]
                }, {
                    xtype: 'container',
                    maxHeight: 200,
                    layout: {type: 'hbox', align: 'stretch'},
                    defaults: {flex: 1},
                    items: [balanceStatisticsPanel]
                }, {
                    xtype: 'container',
                    maxHeight: '100',
                    layout: {type: 'hbox', align: 'stretch'},
                    defaults: {flex: 1},
                    items: [{
                        xtype: 'gridpanel',
                        title: 'Sample',
                        store: Ext.data.StoreManager
                            .lookup('simpsonsStore'),
                        columns: [{
                            text: 'Sample',
                            dataIndex: 'name'
                        }]
                    }, {
                        xtype: 'gridpanel',
                        title: 'Tests',
                        store: Ext.data.StoreManager
                            .lookup('simpsonsStore'),
                        columns: [{
                            text: 'Pseudo R-squared',
                            dataIndex: 'name'
                        }, {
                            text: 'LR Chi-squared',
                            dataIndex: 'email',
                            flex: 1
                        }, {
                            text: 'p > chi-squared',
                            dataIndex: 'name'
                        }, {
                            text: 'Mean Bias',
                            dataIndex: 'email',
                            flex: 1
                        }, {
                            text: 'Median Bias',
                            dataIndex: 'email',
                            flex: 1
                        }]
                    }]
                }]

            }, {
                title: 'Distribution Before and After Matching',
                layout: {type: 'vbox', align: 'stretch'},
                defaults: {flex: 1},
                items: [{
                    xtype: 'fieldset',
                    title: 'Before Matching',
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    defaults: {
                        flex: 1
                    },
                    items: [{
                        xtype: 'container',
                        items: [{
                            xtype: 'gridpanel',
                            title: 'Percentiles',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]
                        }]
                    }, {
                        xtype: 'container',
                        items: [{
                            xtype: 'gridpanel',
                            title: 'Smallest',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]
                        }, {
                            xtype: 'gridpanel',
                            title: 'Largest',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]

                        }]
                    }, {
                        xtype: 'container',
                        items: [{
                            xtype: 'gridpanel',
                            title: 'Moments',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]
                        }]
                    }]
                }, {
                    xtype: 'fieldset',
                    title: 'After Matching',
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    defaults: {
                        flex: 1
                    },
                    items: [{
                        xtype: 'container',
                        items: [{
                            xtype: 'gridpanel',
                            title: 'Percentiles',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]
                        }]
                    }, {
                        xtype: 'container',
                        items: [{
                            xtype: 'gridpanel',
                            title: 'Smallest',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]
                        }, {
                            xtype: 'gridpanel',
                            title: 'Largest',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]

                        }]
                    }, {
                        xtype: 'container',
                        items: [{
                            xtype: 'gridpanel',
                            title: 'Moments',
                            store: Ext.data.StoreManager
                                .lookup('simpsonsStore'),
                            columns: [{
                                text: 'Sample',
                                dataIndex: 'name'
                            }]
                        }]
                    }]
                }]
            }]
        }];
        this.callParent();
    }
});
