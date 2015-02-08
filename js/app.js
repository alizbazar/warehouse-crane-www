var baseUrl = 'http://192.168.1.213:5000';
//var baseUrl = 'http://192.168.240.197:5000';

/*global define, console*/

/**
 * App module
 */

isAutoMapUpdateOn = false;

define({
    name: 'app',
    requires: [
        'core/event',
        'core/application',
        'views/initPage'
    ],
    def: function appInit(req) {
        'use strict';

        console.log('app::def');

        var e = req.core.event,
            app = req.core.application,
            OPERATION_ALARM = 'http://tizen.org/appcontrol/operation/alarm';

        function init() {
            var appOperation = app.getCurrentApplication()
                .getRequestedAppControl()
                .appControl
                .operation;

            if (appOperation.indexOf(OPERATION_ALARM) !== -1) {
                e.fire('timeAlarm', {
                    time: appOperation.substr(OPERATION_ALARM.length + 1)
                });
            }
            console.log('app::init');
        }

        e.listeners({
            'core.storage.idb.open': init
        });

        return {
            //init: init
        };
    }
});


var task = null;
var item = null;
var newItem = null;

var mock = {
    items: [
        {name: "Koskenkorva", info: "weight:1000kg; dimensions:1000x780x460"},
        {name: "Virun Valkee", info: "weight:850kg; dimensions:800x860x500"},
        {name: "Jaloviina", info: "weight:900kg; dimensions:900x800x520"}
    ],
    simulateNewItem: function() {
        $('.task-actions.incoming-select .ui-btn').removeAttr('disabled');
        var r = parseInt(Math.random() * 100,10)%3;
        newItem = mock.items[r];
    }
};

function resetAll() {
    switchView('no-tasks');
    $('.task-actions.incoming-select .ui-btn').attr('disabled', 'disabled');
    item = null;
    task = null;
    newItem = null;
    getNextTask();
}

function getNextTask(callback) {
    // GET NEXT ITEM

    $.get(baseUrl + '/api/getNextTask', function(data) {
        if (data.success == false) {
            switchView('no-tasks');
        }
        console.log(data);
        task = data;
        if (task.name == 'GET_ITEM') {
            // CACHE it's data
            item = task.item;
            switchView('outgoing-start');
        } else if (task.name == 'INCOMING_CARGO') {
            switchView('incoming-start');
        } else {
            // TODO: error handling if no task name
            switchView('no-tasks');
        }
    });

}

// Relevant divs:
// incoming-start incoming-select incoming-transfer incoming-more outgoing-start outgoing-map outgoing-transfer
// .task-content, .task-actions
function switchView(view) {
    $('.task-content, .task-actions').not('.' + view).toggleClass('hidden', true);
    $('.task-content.' + view + ', .task-actions.' + view).toggleClass('hidden', false);
}

function updateMap(pos, item) {
    var sourceCoords = {
        item: {
            x: item.location.bridge,
            y: item.location.trolley,
            z: item.location.hoist
        },
        tag: {
            x: pos.x,
            y: pos.y,
            z: pos.z
        },
        crane: {
            x: pos.bridge,
            y: pos.trolley,
            z: pos.hoist
        }
    };

    console.log(sourceCoords);

    // do the conversion to 0-100
    var convert = {
        x: function(val) {
            var scale = BRIDGE_LEFT - BRIDGE_RIGHT;
            return Math.floor((val - BRIDGE_RIGHT) / scale * 100);
        },
        y: function(val) {
            var scale = TROLLEY_FAR - TROLLEY_NEAR;
            return Math.floor((val - TROLLEY_NEAR) / scale * 100);
        }
    };

    var destCoords = {
        item: {
            x: convert.x(sourceCoords.item.x),
            y: convert.y(sourceCoords.item.y)
        },
        tag: {
            x: convert.x(sourceCoords.tag.x),
            y: convert.y(sourceCoords.tag.y)
        },
        crane: {
            x: convert.x(sourceCoords.crane.x),
            y: convert.y(sourceCoords.crane.y)
        }
    };
    console.log(destCoords);

    // TODO: update map values
    $("#item").css("left", destCoords.item.x+"%");
    $("#item").css("top", destCoords.item.y+"%");
 
    $("#tag").css("left", destCoords.tag.x+"%");
    $("#tag").css("top", destCoords.tag.y+"%");
    
    $("#crane").css("left", destCoords.crane.x+"%");
    $("#crane").css("top", destCoords.crane.y+"%");

}

var spinner = (function() {
    var $spinner = $('#spinner');
    var $disabledButtons = null;

    var stop = function(notification) {
        $spinner.toggleClass('hidden', true);
        if (!!$disabledButtons) {
            $disabledButtons.removeAttr('disabled');
        }
        $disabledButtons = null;
        if (notification) {
            $.post('/api/notify', {"notification": notification}, function() {
                console.log('notified server');
            });
        }
    };

    return {
        spin: function() {
            if (!!$disabledButtons) {
                return;
            }
            $spinner.toggleClass('hidden', false);
            $disabledButtons = $('.task-actions').not('.hidden').find('.ui-btn').add('#move-crane-to-target').add('#move-crane-here');
            $disabledButtons.attr('disabled', 'disabled');
            setTimeout(function() {
                if ($disabledButtons) {
                    stop('Stopped by TIMEOUT');
                }
            }, 5000);
        },
        stop: stop
    }
}());

$('.ui-page').on('click', '.ui-btn', function(e) {
    var $btn = $(this);
    var context = $btn.closest('footer').data('context');

    var autoUpdateMap = function() {
        console.log("autoUpdateMap");
        if (context == 'outgoing-start') {
            console.log("AUTOUPDATING");
            getPositions(function(pos) {
                if (item) {
                  updateMap(pos, item);
                }
            });
        }
        setTimeout(autoUpdateMap, 1000);
    }

    if (context == 'incoming-start') {
        switchView('incoming-select');
        newItem = null;
        // Switch .task-content text with item name when in proximity
        // toggle disabled state of the button
        setTimeout(function() {
            mock.simulateNewItem();
        }, 1000);

    } else if (context == 'incoming-select') {
        // TODO: select item, send to server
        if (!newItem) {
            console.log('error: newItem is NULL');
            resetAll();
            return;
        }

        spinner.spin();
        $.post(baseUrl + '/api/item/create', newItem, function(data) {
            console.log(data);
            item = data.item;
            switchView('incoming-transfer');
            spinner.stop();
        });

    } else if (context == 'incoming-transfer') {
        // bridge: "7030"hoist: "1063"trolley: "1157"x: 7634y: 972z: 1227
        spinner.spin();
        getPositions(function(pos) {
            $.post(baseUrl + '/api/item/' + item._id + '/setLocation', {bridge: pos.bridge, hoist: pos.hoist, trolley: pos.trolley}, function(data) {
                console.log(data);
                switchView('incoming-more');
                console.log('pos:', pos);
                spinner.stop();
            });
        });

        // get crane location, save location to item data 
    } else if (context == 'incoming-more') {
        // identify yes / no
        if ($btn.hasClass('confirm-btn')) {
            switchView('incoming-select');
            newItem = null;
            $('.task-actions.incoming-select .ui-btn').attr('disabled', 'disabled');

            // Switch .task-content text with item name when in proximity
            // toggle disabled state of the button
            setTimeout(function() {
                mock.simulateNewItem();
            }, 1000);
        } else {
            // no => mark task complete && getNextItem
            spinner.spin();
            $.post(baseUrl + '/api/task/' + task._id + '/setStatus', {status: 'COMPLETED'}, function(data) {
                console.log(data);
                item = null;
                task = null;
                resetAll();
                spinner.stop();
            });
        }
    } else if (context == 'outgoing-start') {
        // TODO: (set task status to STARTED)?? && get own location & crane location, draw crane, item & me on the map && display item identifier
        spinner.spin();
        getPositions(function(pos) {
            switchView('outgoing-map');
        	if(!isAutoMapUpdateOn) {
        		isAutoMapUpdateOn = true;
        		setTimeout(autoUpdateMap, 1000);
        	}
            updateMap(pos, item);
            spinner.stop();
        });
    } else if (context == 'outgoing-map') {
        // (change item status as to LEAVING_STORAGE) -> done with setting task status to STARTED
        spinner.spin();
        $.post(baseUrl + '/api/task/' + task._id + '/setStatus', {status: 'STARTED'}, function(data) {
            console.log(data);
            switchView('outgoing-transfer');
            spinner.stop();
        });
        // TODO: highlight when item close by
    } else if (context == 'outgoing-transfer') {
        // TODO: remove item from storage && getNextItem
        spinner.spin();
        $.post(baseUrl + '/api/task/' + task._id + '/setStatus', {status: 'COMPLETED'}, function(data) {
            console.log(data);
            spinner.stop();
            resetAll();
        });
    } else if (context == 'no-tasks') {
        resetAll();
    }
});

$('#move-crane-here').on('click', function() {
    console.log('crane-moving-here');
    spinner.spin();
    getPositions(function(pos) {
        setCranePosition(pos.x, pos.z, pos.y, function() {
            spinner.stop('Crane target set');
        });
    });
});

$('#move-crane-to-target').on('click', function() {
    console.log('crane-moving-to-target');
    if (item && item.location) {
        spinner.spin();
        setCranePosition(item.location.bridge, item.location.hoist, item.location.trolley, function() {
            spinner.stop('Crane target set');
        });
    }
});


getNextTask();