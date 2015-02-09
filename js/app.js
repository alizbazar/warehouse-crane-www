var baseUrl = window.location.href.indexOf('localhost:') == -1 ? 'https://warehouse-crane.herokuapp.com' : 'http://localhost:5000';

// Crane limits
var HOIST_TOP = 10000;
var HOIST_BOTTOM = 200;
var BRIDGE_LEFT = 14000;
var BRIDGE_RIGHT = 8000;
var TROLLEY_NEAR = 1200;
var TROLLEY_FAR = 7800;

/*global define, console*/

/**
 * App module
 */

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
var currentCraneTarget = null;

var currentView = 'no-tasks';
var home = {
    x: 8000,
    y: 1200,
    z: 1000
};

var mock = {
    noSensor: true,
    items: [
        {name: "Koskenkorva", info: "weight:1000kg; dimensions:1000x780x460"},
        {name: "Virun Valkee", info: "weight:850kg; dimensions:800x860x500"},
        {name: "Jaloviina", info: "weight:900kg; dimensions:900x800x520"}
    ],
    sensor: (function() {
        var itemNear = null;
        var callback = null;

        return {
            sense: function(item) {
                if (item) {
                    itemNear = item;
                    callback(item);
                } else {
                    var r = parseInt(Math.random() * 99,10)%3;
                    itemNear = mock.items[r];
                    callback(itemNear);
                }
            },
            turnOff: function() {
                itemNear = null;
                callback = null;
            },
            searchForItems: function(cb) {
                callback = cb;
            },
            getItemNearBy: function() {
                return itemNear;
            }
        };
    }()),

    noCrane: true, // This determines if crane mocking functions are in use
    crane: (function() {
        var position = {
            bridge: 9000,
            trolley: 5000,
            hoist: 2000,
            x: 12000,
            y: 3000,
            z: 1200
        };

        var delta = {
            x: BRIDGE_LEFT - BRIDGE_RIGHT,
            y: TROLLEY_FAR - TROLLEY_NEAR,
            z: HOIST_TOP - HOIST_BOTTOM
        };

        var moveTag = function(target) {
            if (!mock.noCrane) {
                return;
            }
            if (target === true) { // moving to loading area
                position.x = home.x;
                position.y = home.y;
                position.z = home.z;
            } else if (target) { // target is location object
                position.x = target.bridge;
                position.y = target.trolley;
                position.z = target.hoist;
            } else {
                position.x = parseInt(Math.random() * delta.x + BRIDGE_RIGHT, 10);
                position.y = parseInt(Math.random() * delta.y + TROLLEY_NEAR, 10);
                position.z = parseInt(Math.random() * delta.z + HOIST_BOTTOM, 10);
            }
        };

        return {
            moveCraneToCenter: function() {
                position.bridge = (BRIDGE_RIGHT + BRIDGE_LEFT)/2;
                position.trolley = (TROLLEY_FAR + TROLLEY_NEAR)/2;
            },
            setCranePosition: function(bridge, hoist, trolley, callback) {
                position.bridge = bridge;
                position.trolley = trolley;
                position.hoist = hoist;
                callback();
                alert('Crane moved to ' + bridge + ';' + hoist + ';' + trolley);
            },
            getPositions: function(callback) {
                callback(position);
            },
            moveTag: moveTag
        };
    }()),

    demoMode: true
};

// Use mock crane if no crane available
if (mock.noCrane) {
    setCranePosition = mock.crane.setCranePosition;
    getPositions = mock.crane.getPositions;
}

// Use mock sensor if no sensor available
if (mock.noSensor) {
    sensor = mock.sensor;
}

if (mock.demoMode) {
    $('#mockGenerateMore').toggleClass('hidden', false);
    $('#mockGenerateMore button').click(function() {
        spinner.spin();
        $.post(baseUrl + '/api/generateMoreTasks', function() {
            spinner.stop();
            resetAll();
        });
    });
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
        if (callback) {
            callback();
        }
    });

}

// Relevant divs:
// VIEWS: incoming-start incoming-select incoming-transfer incoming-more outgoing-start outgoing-map outgoing-transfer
// AREAS: .task-content, .task-actions
function switchView(view) {
    $('.task-content, .task-actions').not('.' + view).toggleClass('hidden', true);
    $('.task-content.' + view + ', .task-actions.' + view).toggleClass('hidden', false);
    currentView = view;
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
            $.post(baseUrl + '/api/notify', {"notification": notification}, function() {
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


function resetAll() {
    switchView('no-tasks');
    resetIncomingSelect();
    item = null;
    task = null;
    sensor.turnOff();
    currentCraneTarget = null;
    spinner.spin();
    getNextTask(function() {
        spinner.stop();
    });
}


function incomingSelect(newItem) {
    // toggle disabled state of the button
    $('.task-actions.incoming-select .ui-btn').removeAttr('disabled');
    // Switch .task-content text with item name when in proximity
    $('.task-content.incoming-select .default-message').toggleClass('hidden', true);
    $('.task-content.incoming-select .alt-message').text(newItem.name).toggleClass('hidden', false);
}
function resetIncomingSelect() {
    $('.task-actions.incoming-select .ui-btn').attr('disabled', 'disabled');
    $('.task-content.incoming-select .default-message').toggleClass('hidden', false);
    $('.task-content.incoming-select .alt-message').text('').toggleClass('hidden', true);
}

$('.ui-page').on('click', '.ui-btn', function(e) {
    var $btn = $(this);
    var context = $btn.closest('footer').data('context');

    if (context == 'incoming-start') {
        if (mock.noCrane) {
            mock.crane.moveTag(true); // Go to loading area
        }
        currentCraneTarget = 'LOADING_AREA';
        switchView('incoming-select');

        sensor.searchForItems(function(newItem) {
            if (newItem) {
                incomingSelect(newItem);
            } else {
                resetIncomingSelect();
            }
        });
        if (mock.noSensor) {
            setTimeout(function() {
                mock.sensor.sense();
            }, 3000);
        }

    } else if (context == 'incoming-select') {
        // select item, send to server
        var newItem = sensor.getItemNearBy();
        if (!newItem) {
            console.log('error: No items near by');
            resetAll();
            return;
        }

        sensor.turnOff();

        currentCraneTarget = null;

        spinner.spin();
        $.post(baseUrl + '/api/item/create', newItem, function(data) {
            console.log(data);
            item = data.item;
            if (mock.noCrane) {
                mock.crane.moveTag(); // Go to random area
            }
            switchView('incoming-transfer');
            spinner.stop();
            if (mock.noCrane) {
                mock.crane.moveTag();
            }
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
            currentCraneTarget = 'LOADING_AREA';
            if (mock.noCrane) {
                mock.crane.moveTag(true); // Go back to loading area
            }
            switchView('incoming-select');
            resetIncomingSelect();

            sensor.searchForItems(function(newItem) {
                incomingSelect(newItem);
            });

            if (mock.noSensor) {
                setTimeout(function() {
                    mock.sensor.sense();
                }, 1000);
            }
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
        // get own location & crane location, draw crane, item & me on the map && display item identifier
        currentCraneTarget = 'ITEM';
        spinner.spin();

        // If no real crane is connected, move it to middle of the screen to separate from TAG and ME
        if (mock.noCrane) {
            mock.crane.moveCraneToCenter();
        }
        getPositions(function(pos) {
            switchView('outgoing-map');
            updateMap(pos, item);
            if (mock.noCrane) {
                // Go in a moment to item location
                setTimeout(function() {
                    mock.crane.moveTag(item.location);
                }, 5000);
            }
            spinner.stop();
        });
    } else if (context == 'outgoing-map') {
        // (change item status as to LEAVING_STORAGE) -> done with setting task status to STARTED
        currentCraneTarget = 'LOADING_AREA';
        spinner.spin();
        $.post(baseUrl + '/api/task/' + task._id + '/setStatus', {status: 'STARTED'}, function(data) {
            console.log(data);
            if (mock.noCrane) {
                mock.crane.moveTag(true); // Go to loading area
            }
            switchView('outgoing-transfer');
            spinner.stop();
        });
        // TODO: highlight when item close by
    } else if (context == 'outgoing-transfer') {
        currentCraneTarget = null;
        // remove item from storage && getNextItem
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
            spinner.stop('Crane target set to TAG location');
        });
    });
});

$('#move-crane-to-target').on('click', function() {
    console.log('crane-moving-to-target');
    if (item && item.location && currentCraneTarget == 'ITEM') {
        spinner.spin();
        setCranePosition(item.location.bridge, item.location.hoist, item.location.trolley, function() {
            spinner.stop('Crane target set to ITEM location');
        });
    } else if (currentCraneTarget == 'LOADING_AREA') {
        spinner.spin();
        setCranePosition(home.x, home.z, home.y, function() {
            spinner.stop('Crane target set to LOADING AREA')
        });
    }
});


// autoupdate map whenever in view
(function autoUpdateMap() {
    if (currentView == 'outgoing-map') {
        getPositions(function(pos) {
            if (item) {
              updateMap(pos, item);
            }
        });
    }
    setTimeout(autoUpdateMap, 1000);
}());

getNextTask();

