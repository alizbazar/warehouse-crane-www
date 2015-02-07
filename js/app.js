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

var baseUrl = 'http://localhost:5000';

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
    item = null;
    newItem = null;
    getNextTask();
}

function getNextTask(callback) {
    // GET NEXT ITEM

    $.get(baseUrl + '/api/getNextTask', function(task) {
        if (task.success == false) {
            switchView('no-tasks');
        }
        console.log(task);
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

$('.ui-page').on('click', '.ui-btn', function(e) {
    var $btn = $(this);
    var context = $btn.closest('footer').data('context');

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

        $.post(baseUrl + '/api/item/create', newItem, function(data) {
            console.log(data);
        });
        switchView('incoming-transfer');

    } else if (context == 'incoming-transfer') {
        var positions = getPositions();
        console.log('pos:', positions);
        // TODO: get crane location, save location to item data 
        switchView('incoming-more');
    } else if (context == 'incoming-more') {
        // TODO: identify yes / no
        if ($btn.hasClass('confirm-btn')) {
            switchView('incoming-start');
        } else {
            // TODO: no => mark task complete && getNextItem
            getNextTask();
        }
    } else if (context == 'outgoing-start') {
        // TODO: set task status to STARTED && get own location & crane location, draw crane, item & me on the map && display item identifier
        switchView('outgoing-map');
    } else if (context == 'outgoing-map') {
        // TODO: change item status as to LEAVING_STORAGE
        switchView('outgoing-transfer');
    } else if (context == 'outgoing-transfer') {
        // TODO: remove item from storage && getNextItem
        getNextTask();
    }
});


getNextTask();