angular.module('ng-puremodels', []);

angular.module('ng-puremodels').factory('action', [function () {
        var defaultCssAliases = {
            'add' : 'fa fa-plus'
        };

        var defaultOptions = {
            iconClassesPrefix : 'fa fa-',
            btnClasses : 'btn btn-default',
            btnClassesProcessing : 'btn btn-warning',
            btnClassesFinishSuccess : 'btn btn-success',
            btnClassesFinishFailure : 'btn btn-danger',

            text_processing_suffix : '_processing',
            text_finish_success_suffix : '_success',
            text_finish_failure_suffix : '_failure'

        };

        var res = function (actionName, handler, options) {
            var _this = this;

            if (options === undefined) {
                options = defaultOptions;
                options.cssAliases = defaultCssAliases;
            }

            if (options.cssAliases === undefined) {
                options.cssAliases = defaultCssAliases;
            }

            this.name = actionName;
            this.text = actionName;


            this.visible = true;
            this.processing = false;
            this.finishing = false;

            if (options.cssAliases[actionName] === undefined) {
                this.iconClasses = 'fa fa-' + actionName;
            } else {
                this.iconClasses = options.cssAliases[actionName];
            }


            this.disabled = false;
            this.btnClasses = 'btn btn-default';

            if (angular.isFunction(handler[actionName])) {
                this.invoke = handler[actionName];
            } else {
                this.invoke = function () {
                    this.console.log('empty handler for:' + actionName);
                }
            }

            // public methods
            this.processing = function() {
                _this.disabled = true;
                _this.textOrigin = _this.text;
                _this.btnClassesOrigin = _this.btnClasses;

                _this.text =  _this.text+'_processing';
                _this.btnClasses = 'btn btn-warning';

            }

            this.finishing = function(success) {

                if (success) {
                    _this.text = _this.textOrigin+'_success';
                    _this.btnClasses = 'btn btn-success';
                } else {
                    _this.text = _this.textOrigin+'_failure';
                    _this.btnClasses = 'btn btn-danger';
                }

            }

            this.normal = function() {
                _this.text = _this.textOrigin;
                _this.btnClasses = _this.btnClassesOrigin;
            }
        }
        return res;
    }]
);
angular.module('ng-puremodels').factory('async', ['$timeout', function ($timeout) {
        var res = function () {
            var _this = this;
            var messagesIdCount = 0;
            var hash = {

            };

            function addAndDeleteAfterTimeout(data, timeoutInSec) {
                messagesIdCount++;
                hash[messagesIdCount] = data;
                var id=messagesIdCount;
                $timeout(function(){
                    delete hash[id];
                }, timeoutInSec*1000);

                return id;
            }

            function replace(topicId, data) {
                delete hash[topicId];
                hash[topicId] = {};

                messagesIdCount++;
                var id=messagesIdCount;

                var topicIdP = topicId;

                hash[topicId][id] = data;

                return id;
            }

            function replaceAndDeleteAfterTimeout(topicId, data, timeoutInSec) {
                delete hash[topicId];
                hash[topicId] = {};

                messagesIdCount++;
                var id=messagesIdCount;

                var topicIdP = topicId;

                hash[topicId][id] = data;

                $timeout(function(){
                    delete hash[topicIdP][id];
                    console.log('deleted')
                }, timeoutInSec*1000);

                return id;
            }

            function withBoolean(setter, operation) {
                setter(true);

            }

            this.objectsMap = hash;
            this.addAndDeleteAfterTimeout = addAndDeleteAfterTimeout;
            this.replaceAndDeleteAfterTimeout = replaceAndDeleteAfterTimeout;
            this.replace = replace;
        }
        return res;
    }]
);
angular.module('ng-puremodels').factory('crud', ['action', 'sortable', '$timeout', function (action, sortable, $timeout) {
    var result = function (someList, names, crudPermissions) {
        var _this = this;


        var sortableSelectableList = new sortable(someList, names);
        var itemInEdit = null;
        var itemIndexInEdit = -1;


        if (crudPermissions === undefined) {
            crudPermissions = {
                view: true,
                edit: true,
                add: true,
                remove: true
            }
        }


        function create(prototype) {
            return {};
        }

        function add() {
            _this.adding = true;

            recomputeActionsEnabledStates();
        }

        function close() {
            _this.adding = false;
            _this.editing = false;


            if (!_this.adding && !_this.editing) {
                if (_this.getSelectedIndex() !== -1) {
                    _this.toggleIndex(_this.getSelectedIndex());
                }
            }
            recomputeActionsEnabledStates();
        }

        function edit() {
            _this.adding = false;
            _this.editing = true;

            _this.itemInEditOriginal = sortableSelectableList.selectable.getSelectedObject();
            _this.itemInEdit = angular.copy(_this.itemInEditOriginal);

            recomputeActionsEnabledStates();
        }

        function persistAddDefault(success, error) {
            $timeout(function() {
                success(_this.itemInEdit);
            }, 1000);
        }

        function persistSaveDefault(success, error) {
            $timeout(function() {
                success(_this.itemInEdit);
            }, 1000);
        }

        function persistTrashDefault(success, error) {
            var selectedObject = sortableSelectableList.selectable.getSelectedObject();
            $timeout(function() {
                success(selectedObject);
            }, 1000);
        }

        function save() {
            // save acts differently when adding new
            if (_this.adding) {
                _this.error = undefined;
                _this.saving = true;

                _this.actions.save.processing();
                _this.persistAdd(function (newItem) {
                    sortableSelectableList.list.push(newItem);
                    sortableSelectableList.selectable.restoreSelection();

                    // sort again
                    sortableSelectableList.sorting.onChange();

                    _this.actions.save.finishing(true);
                    _this.saving = false;
                    $timeout(function() {
                        _this.actions.save.normal();

                        _this.adding = false;
                        _this.editing = false;

                        recomputeActionsEnabledStates();
                    }, 2000);


                }, function (error) {
                    _this.actions.save.normal();
                    _this.saving = false;
                    _this.error = error;
                    recomputeActionsEnabledStates();
                });
            }

            if (_this.editing) {
                _this.error = undefined;
                _this.saving = true;

                _this.actions.save.processing();

                _this.persistSave(function (updatedItem) {
                    angular.copy(updatedItem, _this.itemInEditOriginal);

                    _this.actions.save.finishing(true);
                    _this.saving = false;
                    $timeout(function() {
                        _this.actions.save.normal();

                        _this.adding = false;
                        _this.editing = false;

                        recomputeActionsEnabledStates();
                    }, 2000);


                }, function (error) {
                    _this.actions.save.normal();
                    _this.saving = false;
                    _this.error = error;
                    recomputeActionsEnabledStates();
                });
            }

        }

        function trash() {
            _this.persistTrash(function (deletedItem) {
                var indexOfDeletedItem = sortableSelectableList.selectable.indexOf(deletedItem);
                if (indexOfDeletedItem != -1) {
                    var removed = sortableSelectableList.list.splice(indexOfDeletedItem, 1);
                }

                sortableSelectableList.selectable.restoreSelection();

                // sort again
                sortableSelectableList.sorting.onChange();

                recomputeActionsEnabledStates();

            }, function (error) {
                _this.error = error;
            });

            recomputeActionsEnabledStates();
        }


        function recomputeActionsEnabledStates() {
            if (_this.adding || _this.editing) {
                _this.actions.add.visible = false;
                _this.actions.edit.visible = false;
                _this.actions.save.visible = true;
                _this.actions.trash.visible = false;
                _this.actions.close.visible = true;
            } else {
                _this.actions.add.visible = true;
                _this.actions.edit.visible = true;
                _this.actions.save.visible = false;
                _this.actions.trash.visible = true;
                _this.actions.close.visible = true;
            }

            if (_this.loading || _this.saving) {
                _this.actions.add.disable = true;
                _this.actions.edit.disable = true;
                _this.actions.save.disable = true;
                _this.actions.trash.disable = true;
                _this.actions.close.disable = true;


                return;
            }

            if (_this.adding || _this.editing) {
                _this.actions.add.disable = true;
                _this.actions.edit.disable = true;
                _this.actions.save.disable = false;
                _this.actions.trash.disable = true;
                _this.actions.close.disable = false;

                return;
            }

            if (_this.getSelectedIndex() !== -1) {
                _this.actions.add.disable = false;
                _this.actions.edit.disable = false;
                _this.actions.save.disable = true;
                _this.actions.trash.disable = false;
                _this.actions.close.disable = false;

                return;
            } else {
                _this.actions.add.disable = false;
                _this.actions.edit.disable = true;
                _this.actions.save.disable = true;
                _this.actions.trash.disable = true;
                _this.actions.close.disable = true;
            }

            console.log('_this.actions.edit.disable:', _this.actions.edit.disable);
        }

        // public flags
        this.editing = false;
        this.loading = false;
        this.saving = false;
        this.adding = false;

        // when editing, keep pointer to original item
        this.itemInEdit = null;
        this.itemInEditOriginal = null;

        // actions
        this.add = add;
        this.save = save;
        this.edit = edit;
        this.trash = trash;
        this.close = close;

        // public methods
        this.persistAdd = persistAddDefault;
        this.persistSave = persistSaveDefault;
        this.persistTrash = persistTrashDefault;


        // delegate for convinience
        this.list = sortableSelectableList.list;
        this.selectable = sortableSelectableList.selectable;
        this.sorting = sortableSelectableList.sorting;

        // selection disabled on curtain conditions
        this.toggleIndex = function (i) {
            if (!_this.loading && !_this.saving && !_this.editing && !_this.adding) {
                _this.selectable.toggleIndex(i);
                recomputeActionsEnabledStates();
            }
        }

        this.getSelectedIndex = function() {
            return _this.selectable.getSelectedIndex();
        }

        // make it easier to activate
        var defaultActionsNames = 'add,save,edit,trash,close'.split(',');
        var actions = {};

        // complete actions metadata
        for (var i = 0; i < defaultActionsNames.length; i++) {
            var actionName = defaultActionsNames[i];
            actions[actionName] = new action(actionName, this);
        }

        this.actions = actions;

        recomputeActionsEnabledStates();
    };

    return result;
}]);
/**
 * @ngdoc service
 * @name ng-puremodels.service:flags
 *
 * @description
 * provide common simple functionality on selection on string values
 * can be seen as collection of boolean values with event on change
 *
 **/
angular.module('ng-puremodels').factory('flags', [
    function () {
        var result = function (stringsArray, initialValue, initialSelected) {
            var _this = this;

            var initValueBoolean = initialValue == true ? true : false;

            _this.list = stringsArray !== undefined ? stringsArray.slice(0) : [];

            _this.names = {};

            _this.selected = undefined;

            function set(name, value) {
                var oldValue = _this.names[name];


                if (oldValue !== value) {
                    _this.selected = undefined;
                    if (value === true) {
                        _this.selected = name;
                    }
                    _this.names[name] = value;
                    if (_this.fireChangeSelectionEvent !== undefined) {
                        _this.fireChangeSelectionEvent(name, value);
                    }
                }
            }

            function setAll(value, exludeName) {
                for (var i = 0; i < _this.list.length; i++) {
                    var name = _this.list[i];
                    if (name === exludeName) {
                        continue;
                    }

                    _this.names[name] = value;
                }
            }

            function fireChangeSelectionEventDefault(name, value) {
                console.log('flags change event:', name, '=', value);
            }

            setAll(initValueBoolean);

            /**
             * @ngdoc method
             * @name unselectAll
             * @methodOf ng-puremodels.service:flags
             *
             * @description
             * unselect all
             *
             *
             */
            _this.unselectAll = function() {
                setAll(false);

                if (fireChangeSelectionEvent !== undefined) {
                    fireChangeSelectionEvent(undefined, value);
                }
            }

            /**
             * @ngdoc method
             * @name selectAll
             * @methodOf ng-puremodels.service:flags
             *
             * @description
             * select all
             *
             *
             */
            _this.selectAll = function() {
                setAll(true);
                fireChangeSelectionEvent(undefined, value);
            }

            /**
             * @ngdoc method
             * @name select
             * @methodOf ng-puremodels.service:flags
             *
             * @description
             * mark 'name' with true
             *
             *
             */
            _this.select = function(name) {
                set(name, true);
            }

            /**
             * @ngdoc method
             * @name selectOne
             * @methodOf ng-puremodels.service:flags
             *
             * @description
             * mark 'name' with true, and others with false
             *
             *
             */
            _this.selectOne = function(name) {
                setAll(false, name);
                set(name, true);
            }

            /**
             * @ngdoc method
             * @name unselect
             * @methodOf ng-puremodels.service:flags
             *
             * @description
             * mark 'name' with true
             *
             *
             */
            _this.unselect = function(name) {
                set(name, false);
            }

            /**
             * @ngdoc method
             * @name toggle
             * @methodOf ng-puremodels.service:flags
             *
             * @description
             * mark 'name' with true if false and false if true
             *
             *
             */
            _this.toggle = function(name) {
               set(name, !_this.names[name]);
            }

            _this.fireChangeSelectionEvent = fireChangeSelectionEventDefault;

            if (initialSelected !== undefined) {
                _this.selectOne(initialSelected);
            }
        };
        return result;
    }]);
angular.module('ng-puremodels').factory('groupable', ['selectable', function (selectable) {
    var res = function (someList, propertiesArray) {
        var _this = this;

        var list = someList === undefined ? [] : someList.slice(0);

        function default_schema_info_provider() {
            this.getPropertyType = function (schemaName, propertyName, propertyValue) {
                if (propertyValue === undefined) {
                    return 'object';
                }

                var res = typeof propertyValue;
                if (res === 'object') {
                    if (Object.prototype.toString.call(propertyValue) === '[object Array]') {
                        res = 'array';
                    }
                }
                return res;
            }
        }

        var schema_info_provider = new default_schema_info_provider();

        var properties = _.map(propertiesArray, function(name) {
            var type = typeof list[0][name];
            return { 'name' : name, 'type' : type};
        });
        properties.splice(0, 0, { 'name' : '__none__'});


        var indexedProperties = _.indexBy(properties, 'name');

        var selectableProperties = new selectable(properties);

        selectableProperties.selectIndex(0); // by default its not grouped

        function groupBy(name) {
            _this.groups = _.chain(list)
                .groupBy(name, indexedProperties[name].iteratee)
                .value();

        };

        selectableProperties.fireChangeSelectionEvent = function() {
            var name = _this.selectableProperties.getSelectedObject().name;
            if (name === 'none') {
                _this.groups = undefined;
                return;
            }

            groupBy(name);
        }



        this.groupBy = groupBy;
        this.selectableProperties = selectableProperties;
    }
    return res;
}]);

angular.module('ng-puremodels').factory('paging', function () {
        var res = function (totalItems, pageSize) {
            var _this = this;

            this.totalItems = totalItems;
            this.currentPage = 0;
            this.currentOffset = 0;
            this.limitTo = 0;
            this.pageNumbers = [];
            this.visitedPages = {};
            this.needPaging = true;

            this.itemsPerPage = pageSize !== undefined ? pageSize : 4;
            this.maxPagesInView = 5;

            function clearArray(array) {
                while (array.length) {
                    array.pop();
                }
            }

            this.hasNext = function () {
                if ((_this.currentPage + 1) * _this.itemsPerPage > _this.totalItems) {
                    return false;
                }
                return true;
            }

            this.more = function () {
                _this.next();
            };

            this.next = function () {
                _this.setPage(_this.currentPage + 1);
            };

            this.hasPrev = function () {
                if ((_this.currentPage - 1) * _this.itemsPerPage < 0) {
                    return false;
                }
                return true;
            };

            this.prev = function () {
                if (!_this.hasPrev()) {
                    return;
                }
                _this.setPage(_this.currentPage - 1);
            };

            this.home = function () {
                _this.setPage(0);
            };

            this.hasEnd = function () {
                if (_this.totalItems === -1) {
                    return false;
                }
                return true;
            };


            this.all = function () {
                _this.itemsPerPage = _this.totalItems;
                _this.needPaging= false;
                _this.setPage(0);
            };

            this.end = function () {
                _this.itemsPerPage =
                _this.setPage(0);
            };

            this.setPage = function (pageNo) {
                _this.currentPage = pageNo;

                // recompute some variables
                _this.limitTo = (_this.currentPage + 1) * _this.itemsPerPage;
                _this.currentOffset = _this.currentPage * _this.itemsPerPage;

                clearArray(_this.pageNumbers);

                for (var i = 0; i < _this.maxPagesInView; i++) {
                    if ( i  * _this.itemsPerPage <= _this.totalItems) {
                        _this.pageNumbers.push(i);
                    } else {

                    }

                }
            };

            this.pageChanged = function () {
                //$log.log('Page changed to: ' + $scope.currentPage);
            };



            this.setPage(0);
        }
        return res;
    }
);
/**
 * @ngdoc service
 * @name ng-puremodels.service:selectable
 *
 * @description
 * wrap array with select-unselect-event on select functionality
 * selection can be 'single' : only one index can be selected,
 * and 'multi' when number of elements are selected.
 *
 * Two types of selection(single and multi) are not affecting each other.
 **/
angular.module('ng-puremodels').factory('selectable', function () {
    var res = function (someList) {
        var _this = this;
        var list = someList !== undefined ? someList.slice(0) : [];

        // for single selection
        var selectedIndex = -1;
        var selectedObject = undefined;


        // for 'multi' selection
        var multiSelections = [];
        var multiSelectedObjects = [];
        var multiSelectedIndexes = [];

        // init multi selection with no one selected
        for (var i = 0; i < list.length; i++) {
            multiSelections.push(false);
        }

        function clearArray(array) {
            while (array.length) {
                array.pop();
            }
        }

        function rebuildMultiSelectionArrays() {
            clearArray(multiSelectedObjects);
            clearArray(multiSelectedIndexes);

            for (var i = 0; i < list.length; i++) {
                if (multiSelections[i] === true) {
                    multiSelectedObjects.push(list[i]);
                    multiSelectedIndexes.push(i);
                }
            }
        }

        function unselectAll() {
            var changed = false;
            for (var i = 0; i < list.length; i++) {
                if (multiSelections[i] === true) {
                    changed = true;
                }
                multiSelections[i] = false;
            }

            if (changed)
                fireChangeMultiSelectionEvent(-1, false);
        }

        function selectAll() {
            var changed = false;

            for (var i = 0; i < list.length; i++) {
                if (multiSelections[i] === false) {
                    changed = true;
                }
                multiSelections[i] = true;
            }

            if (changed)
                fireChangeMultiSelectionEvent(-1, true);
        }

        function toggleAll() {
            for (var i = 0; i < list.length; i++) {

                multiSelections[i] = !multiSelections[i];
            }

            fireChangeMultiSelectionEvent(-1, undefined);
        }

        function indexOf(object) {
            for (var j = 0; j < list.length; j++) {
                var currInList = list[j];

                if (_this.equal(object, currInList)) {
                    return j;
                }
            }
            return -1;
        }

        function restoreSelection() {
            // empty selection arrays
            clearArray(multiSelections);
            clearArray(multiSelectedIndexes);

            for (var i = 0; i < list.length; i++) {
                multiSelections.push(false);
            }

            for (var i = 0; i < multiSelectedObjects.length; i++) {
                var oldSelected = multiSelectedObjects[i];
                for (var j = 0; j < list.length; j++) {
                    var currInList = list[j];

                    if (_this.equal(oldSelected, currInList)) {
                        multiSelections[j] = true;
                    }
                }
            }

            rebuildMultiSelectionArrays();

            // do same for single selection
            selectedIndex = -1;
            if (selectedObject !== undefined) {
                for (var j = 0; j < list.length; j++) {
                    var currInList = list[j];

                    if (_this.equal(selectedObject, currInList)) {
                        selectedIndex = j;
                    }
                }
            }
        }

        // private method
        // set selected value and fire event if value was changed
        function multiSetSelection(i, value) {
            if (i < 0 || i >= list.length) {
                return;
            }
            var oldValue = multiSelections[i];
            multiSelections[i] = value;
            if (oldValue !== value) {
                fireChangeMultiSelectionEvent(i, value);
            }
        }

        function fireChangeMultiSelectionEvent(index, newValue) {
            rebuildMultiSelectionArrays();
            try {
                if (_this.fireChangeMultiSelectionEvent !== undefined) {
                    _this.fireChangeMultiSelectionEvent(index, newValue);
                }
            } catch (err) {
                console.log(err);
            }
        }

        function multiSelect(i) {
            multiSetSelection(i, true);
        }

        function multiUnselect(i) {
            multiSetSelection(i, false);
        }

        function multiToggleSelect(i) {
            multiSetSelection(i, !multiSelections[i]);
        }

        function getMultiSelectedIndexes() {
            return multiSelections;
        }

        // single selection methods
        function getSelectedIndex() {
            return selectedIndex;
        }
        function getSelectedObject() {
            return selectedObject;
        }

        function setSelectedAndFireChangeEvent(i) {
            if (selectedIndex === i) {
                return;
            }
            else {
                var oldSelectedIndex = selectedIndex;
                var oldSelectedObject = selectedObject;

                if (i < -1 || i >= list.length) {
                    return;
                }

                selectedIndex = i;
                if (i === -1) {
                    selectedObject = undefined;
                } else {
                    selectedObject = list[i];
                }

                // fire event
                fireChangeSelectionEvent(oldSelectedObject, selectedObject, oldSelectedIndex, selectedIndex);
            }
        }

        function fireChangeSelectionEvent(oldSelectedObject, newSelectedObject, oldSelectedIndex, newSelectedIndex) {
            try {
                if (_this.fireChangeSelectionEvent !== undefined) {
                    _this.fireChangeSelectionEvent(oldSelectedObject, selectedObject, oldSelectedIndex, selectedIndex);
                }
            } catch (err) {
                console.log(err);
            }
        }

        function getList() {
            return list;
        }

        function selectIndex(i) {
            setSelectedAndFireChangeEvent(i);
        }

        function unselectIndex(i) {
            setSelectedAndFireChangeEvent(-1);
        }

        function toggleIndex(i) {
            if (selectedIndex === i) {
                setSelectedAndFireChangeEvent(-1);
            } else {
                setSelectedAndFireChangeEvent(i);
            }
        }

        function fireChangeMultiSelectionEventDefault(index, newValue) {
            console.log('multi selection:', index, ';', newValue);
        }

        function fireChangeSelectionEventDefault(oldSelectedObject, newSelectedObject, oldSelectedIndex, newSelectedIndex) {
            console.log('selection:', oldSelectedObject, ';', newSelectedObject, ';', oldSelectedIndex, ';', newSelectedIndex);
        }


        /**
         * @ngdoc method
         * @name getSelectedIndex
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * return selected index in the array, or -1 if nothing selected
         *
         *
         */
        this.getSelectedIndex = getSelectedIndex;

        /**
         * @ngdoc method
         * @name getSelectedObject
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * return selected object in the array, or undefined if nothing selected
         *
         *
         */
        this.getSelectedObject = getSelectedObject;

        /**
         * @ngdoc method
         * @name selectIndex
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * change selected index and fire event if index was changed
         *
         * @param {integer} index value of index to select
         */
        this.selectIndex = selectIndex;

        /**
         * @ngdoc method
         * @name unselectIndex
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * unselect index and fire event if index was changed
         *
         *
         */
        this.unselectIndex = unselectIndex;

        /**
         * @ngdoc method
         * @name unselectIndex
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * toggle selection and fire event if index was changed
         *
         *
         */
        this.toggleIndex = toggleIndex;

        /**
         * @ngdoc method
         * @name fireChangeSelectionEvent
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * function to invoke on change selection event
         */
        this.fireChangeSelectionEvent = fireChangeSelectionEventDefault;

        /**
         * @ngdoc method
         * @name fireChangeMultiSelectionEvent
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * function to invoke on change multi selection event
         */
        this.fireChangeMultiSelectionEvent = fireChangeMultiSelectionEventDefault;

        // multi selection

        /**
         * @ngdoc method
         * @name unselectAll
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * unselect all objects
         */
        this.unselectAll = unselectAll;

        /**
         * @ngdoc method
         * @name selectAll
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * select all objects
         */
        this.selectAll = selectAll;

        /**
         * @ngdoc method
         * @name toggleAll
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * toggle  all objects multi selection
         */
        this.toggleAll = toggleAll;

        /**
         * @ngdoc method
         * @name multiSelect
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * select object in multi selection
         *
         * @param {integer} index value of index to select
         */
        this.multiSelect = multiSelect;

        /**
         * @ngdoc method
         * @name multiUnselect
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * unselect object in multi selection
         *
         * @param {integer} index value of index to select
         */
        this.multiUnselect = multiUnselect;

        /**
         * @ngdoc method
         * @name multiToggleSelect
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * toggleSelect selection on object
         *
         * @param {integer} index value of index to select
         */
        this.multiToggleSelect = multiToggleSelect;

        /**
         * @ngdoc method
         * @name multiSelections
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * array of booleans for selected states
         */
        this.multiSelections = multiSelections;

        /**
         * @ngdoc method
         * @name multiSelectedObjects
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * array selected objects
         */
        this.multiSelectedObjects = multiSelectedObjects;

        /**
         * @ngdoc method
         * @name multiSelectedIndexes
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * array selected indexes
         */
        this.multiSelectedIndexes = multiSelectedIndexes;
        /**
         * @ngdoc method
         * @name getList
         * @methodOf ng-puremodels.service:selectable
         *
         * @description
         * return array of objects
         */
        this.getList = getList;

        /**
         * @ngdoc method
         * @name list
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * array of objects
         */
        this.list = list;

        /**
         * @ngdoc method
         * @name indexOf
         * @propertyOf ng-puremodels.service:selectable
         *
         * @description
         * find index of object in list, based on 'equal' method
         * return index or -1
         */
        this.indexOf = indexOf;

        this.idPropertyNames = undefined;

        this.restoreSelection = restoreSelection;

        this.equal = function (o1, o2) {
            if (_this.idPropertyNames === undefined) {
                _this.idPropertyNames = [];
                for (var prop in _this.idPropertyNames) {
                    _this.idPropertyNames.push(prop);
                }
            }
            if (_this.idPropertyNames.length === 0) {
                return o1 === o2;
            }
            for (var i = 0; i < _this.idPropertyNames.length; i++) {
                var prop = _this.idPropertyNames[i];
                var v1 = o1[prop];
                var v2 = o2[prop];
                if (v1 !== v2) {
                    return false;
                }
            }
            return true;
        }
    }

    return res;
});


/**
 * @ngdoc service
 * @name ng-puremodels.service:sortable
 *
 * @description
 * wrap selectable array with sorting functionality
 **/
angular.module('ng-puremodels').factory('sortable', ['$parse', 'selectable', 'sorting', function ($parse, selectable, sorting) {
    var result = function (someList, names) {
        var _this = this;

        var selectableList = new selectable(someList);
        var sorter = new sorting(names);

        var getters = {};


        sorter.onChange = function () {

            selectableList.list.sort(function (a, b) {
                for (var i = 0; i < sorter.statusesOrderedFifo.length; i++) {

                    var pname = sorter.statusesOrderedFifo[i];
                    if (getters[pname] === undefined) {
                        getters[pname] = $parse('obj.' + pname);
                    }

                    var status = sorter.statuses[pname];

                    if (status === undefined) {
                        console.log('null for:', pname);
                    }
                    if (status.sortDir === 0) {
                        continue;
                    }

                    //var va = a[pname];
                    var context = {obj: a};
                    var va = getters[pname](context);

                    //var vb = b[pname];
                    var context = {obj: b};
                    var vb = getters[pname](context);

                    //console.log('va:', va, ' vb:', vb);

                    if (va === vb) {
                        continue;
                    }
                    if (va === undefined) {
                        return status.sortDir * -1;
                    }
                    if (vb === undefined) {
                        return status.sortDir * 1;
                    }

                    if (angular.isFunction(va.localeCompare)) {
                        var res = va.localeCompare(vb) * status.sortDir;
                    } else {
                        if (va == vb) {
                            return 0;
                        }

                        var res = va > vb ? status.sortDir : -1 * status.sortDir;
                    }


                    return res;
                }
                return 0;
            });

            selectableList.restoreSelection();
        }

        // public properties

        /**
         * @ngdoc method
         * @name list
         * @propertyOf ng-puremodels.service:sortable
         *
         * @description
         * list of objects
         */
        this.list = selectableList.list;

        /**
         * @ngdoc method
         * @name selectable
         * @propertyOf ng-puremodels.service:sortable
         *
         * @description
         * selectable, so all methods of selectable can be accessed
         */
        this.selectable = selectableList;

        /**
         * @ngdoc method
         * @name sorting
         * @propertyOf ng-puremodels.service:sortable
         *
         * @description
         * sorting
         */
        this.sorting = sorter;

    }
    return result;
}]);


/**
 * @ngdoc service
 * @name ng-puremodels.service:sorting
 *
 * @description
 * provide metadata for sort functionality.
 * The concept of sort itself and metadata is separated becouse sometimes sorting
 * performed on server , not on client
 **/
angular.module('ng-puremodels').factory('sorting', function () {
    var res = function (names) {
        var _this = this;
        var names = names !== undefined ? names : [];

        var statuses = {};
        var statusesOrderedFifo = [];

        function init() {
            for (var i = 0; i < names.length; i++) {
                var sortMeta = {
                    name: names[i],
                    defaultSortDir: 0,
                    sortDir: 0
                };
                statuses[names[i]] = sortMeta;

            }
        }

        function createMeta(name) {
            var sortMeta = {
                name: name,
                defaultSortDir: 0,
                sortDir: 0
            };
            return sortMeta;
        }

        function moveToHead(name) {
            var i = findIndexForName(name, statusesOrderedFifo);
            if (i === -1) {
                // first time
                statusesOrderedFifo.splice(0, 0, name);
                names.splice(0, 0, name);
            } else {
                // found
                statusesOrderedFifo.splice(i, 1);
                statusesOrderedFifo.splice(0, 0, name);

            }
        }

        function findIndexForName(name, array) {
            for (var i = 0; i < array.length; i++) {
                var curr = array[i];
                if (curr === name) {
                    return i;
                }
            }
            return -1;
        }



        function getStatus(pname) {
            if (statuses[pname] === undefined) {
                statuses[pname] = createMeta(pname);
            }
            return statuses[pname];
        }

        function defaultOnChange(pname, oldDir, newDir) {
            //console.log('pname:', pname, ' oldDir:', oldDir, ' newDir:', newDir);
        }

        function changeStatus(pname, dir) {
            if (statuses[pname] === undefined) {
                statuses[pname] = createMeta(pname);
            }

            statuses[pname].sortDir = dir;
            moveToHead(pname);
            _this.onChange();
        }

        init();

        // public methods
        /**
         * @ngdoc method
         * @name sortUp
         * @methodOf ng-puremodels.service:sorting
         *
         * @param {pname} string name of property
         * @description
         * change meta data to reflect sort up
         */
        this.sortUp = function (pname) {
            changeStatus(pname, 1);
        }

        /**
         * @ngdoc method
         * @name sortDown
         * @methodOf ng-puremodels.service:sorting
         *
         * @param {pname} string name of property
         *
         * @description
         * change meta data to reflect sort down
         */
        this.sortDown = function (pname) {
            changeStatus(pname, -1);
        }

        /**
         * @ngdoc method
         * @name sortToggle
         * @methodOf ng-puremodels.service:sorting
         *
         * @param {pname} string name of property
         *
         * @description
         * toogle meta data to reflect up or down
         */
        this.sortToggle = function (pname) {
            var status = getStatus(pname);
            //console.log('pname:', pname, ' status:', status);
            if (getStatus(pname).sortDir === 0) {
                _this.sortDown(pname);
                return;
            }
            changeStatus(pname, status.sortDir * -1);
        }

        /**
         * @ngdoc method
         * @name sortReset
         * @methodOf ng-puremodels.service:sorting
         *
         * @param {pname} string name of property
         *
         * @description
         * reset meta data to default
         */
        this.sortReset = function (pname) {
            changeStatus(pname, getStatus(pname).defaultSortDir);
        }

        /**
         * @ngdoc method
         * @name sortAllReset
         * @methodOf ng-puremodels.service:sorting
         *
         *
         * @description
         * reset all meta data to default
         */
        this.sortAllReset = function () {
            for (var i = 0; i < names.length; i++) {
                var status = getStatus(names[i]);
                status.sortDir = status.defaultSortDir;
            }
            _this.onChange();
        }

        /**
         * @ngdoc method
         * @name getStatusVerbose
         * @methodOf ng-puremodels.service:sorting
         *
         *
         * @description
         * return status translated to human readable string. good for mapping to css classes
         */
        this.getStatusVerbose = function(pname, translation) {
            if (translation === undefined) {
                translation = ['sort-asc', 'sort', 'sort-desc'];
            }

            var status = getStatus(pname);

            return translation[status.sortDir+1];
        }

        /**
         * @ngdoc method
         * @name onChange
         * @methodOf ng-puremodels.service:sorting
         *
         *
         * @description
         * method to call when sort changed. Use it for server side sorting
         */
        this.onChange = defaultOnChange;

        // public properties
        this.statuses = statuses;
        this.statusesOrderedFifo = statusesOrderedFifo;
        this.names = names;


    }
    return res;
});
/**
 * @ngdoc service
 * @name ng-puremodels.service:tree
 *
 * @description
 * structure provider for any object, usefull for complex recurcive structures
 * like trees, file systems, data structure etc
 **/
angular.module('ng-puremodels').factory('tree', ['selectable', function (selectable) {
    var result = function (someObject, provider, decorateNodeOnCreate) {
        var _this = this;
        var root = someObject;
        var selectedNode = undefined;


        var provider = provider;
        if (provider === undefined) {
            provider = {
                isLeaf: function (obj) {
                    return obj.children === undefined;
                },
                getUid: function (obj) {
                    if (obj.id !== undefined) {
                        return obj.id;
                    }
                    if (obj.uid !== undefined) {
                        return obj.uid;
                    }
                    if (obj.name !== undefined) {
                        return obj.name;
                    }
                },
                getChildren: function (obj, success, failure) {
                    success(obj.children);
                }
            };
        }


        // private methods
        function getParent(node) {
            var path = node.path;
            if (path.length === 0) {
                return undefined; // root
            }
            var currNode = rootNode;
            for (var i = 0; i < path.length - 1; i++) {
                var currNode = currNode.children[path[i]];
            }
            return currNode;
        }

        function resetNode(node) {
            if (node.children === undefined) {
                return;
            }

            if (node.leaf) {
                return;
            }

            for (var i = 0; i < node.children.length; i++) {
                var currNode = node.children[i];


                var path = node.path.slice(0);
                path.push(i);
                currNode.path = path;

                currNode.id = currNode.path.join('-');

                resetNode(currNode);
            }
        }

        function dropNodeOnAnotherNode(node, anotherNode) {
            if (anotherNode.leaf) {
                moveNodeAfterAnotherNode(node, anotherNode);
                return;
            } else {
                // drop on folder should add node to children
                deleteNode(node);
                addNode(node, anotherNode);
            }
        }

        function addNode(node, anotherNode) {
            anotherNode.children.push(node);
            resetNode(anotherNode);
        }

        function deleteNode(node) {
            var parentNode = getParent(node);
            if (parentNode === undefined) {
                return; // cant remove root
            }
            var indexOfNodeInParent = node.path[node.path.length - 1];
            parentNode.children.splice(indexOfNodeInParent, 1);
            resetNode(parentNode);
        }

        function moveNodeAfterAnotherNode(node, anotherNode) {
            deleteNode(node);

            var parentOfAnotherNode = getParent(anotherNode);
            var index = parentOfAnotherNode.children.length; // default

            // find index of another node, which can be probably changed after deleting
            for (var i = 0; i < parentOfAnotherNode.children.length; i++) {
                var curr = parentOfAnotherNode.children[i];
                if (curr === anotherNode) {
                    index = i;
                    break;
                }
            }

            parentOfAnotherNode.children.splice(index + 1, 0, node);

            resetNode(parentOfAnotherNode);
        }

        function createNode(index, parentNode, object) {
            var res = {path: [], data: object, leaf: true, loading: true, expanded: false};

            res.leaf = provider.isLeaf(object);

            if (parentNode === undefined) {
                return res;
            }

            res.path = parentNode.path.slice(0);
            res.path.push(index);

            res.id = res.path.join('-');
            return res;
        }

        function setSelectedAndFireChangeEvent(node, isSelected) {

            if (node === undefined) {
                // wrong invocation
                return;
            }


            if (selectedNode !== undefined && selectedNode.id === node.id && selectedNode.selected == node.selected) {
                // nothing changed, do nothing
                return;
            }


            var oldSelectedNode = selectedNode;
            if (oldSelectedNode !== undefined) {
                oldSelectedNode.selected = false;
            }


            if (isSelected == true) {
                selectedNode = node;
                selectedNode.selected = isSelected;
            } else {
                selectedNode = undefined;
            }


            // fire event
            fireChangeSelectionEvent(oldSelectedNode, selectedNode);


        }

        function fireChangeSelectionEvent(oldSelectedNode, newSelectedNode) {
            try {
                if (_this.fireChangeSelectionEvent !== undefined) {
                    _this.fireChangeSelectionEvent(oldSelectedNode, newSelectedNode);
                }
            } catch (err) {
                console.log(err);
            }
        }

        function selectNode(node) {
            setSelectedAndFireChangeEvent(node, true);
        }

        function selectNodeAndLoadChildren(node, callback) {
            setSelectedAndFireChangeEvent(node, true);

            loadNodeChildrenAsync(node, callback);
        }

        function unselectNode(node) {
            setSelectedAndFireChangeEvent(node, false);
        }

        function getSelectedNode() {
            return selectedNode;
        }

        function getSelectedNodeId() {
            return getSelectedNode() !== undefined ? getSelectedNode().id : '-1';
        }

        function getLastNodeByPath(pathAsArray) {
            var currNode = rootNode;
            for (var i = 0; i < pathAsArray.length; i++) {
                currNode = currNode.children[pathAsArray[i]];
            }
            return currNode;
        }

        function getNodesBySelectedPath() {
            if (getSelectedNode() === undefined) {
                return undefined;
            }
            var parents = getNodesByPath(getSelectedNode().path);
            return parents;
        }

        function getNodesByPath(pathAsArray) {
            var res = [rootNode];
            var currNode = rootNode;
            for (var i = 0; i < pathAsArray.length; i++) {
                currNode = currNode.children[pathAsArray[i]];
                res.push(currNode);
            }
            return res;
        }


        function expandNode(node) {
            expandNodeAsync(node, function (nn) {
                recomputeArrayOfVisibleNodes();
            });
        }

        function expandNodeAsync(node, callback) {
            node.expanded = true;
            loadNodeChildrenAsync(node, callback);
        }

        function loadNodeChildrenAsync(node, callback) {
            if (callback === undefined) {
                callback = function () {
                };
            }

            if (!node.leaf) {
                if (node.children === undefined) {
                    node.loading = true;
                    provider.getChildren(node.data, function (children) {

                        node.loading = false;
                        node.children = [];
                        for (var i = 0; i < children.length; i++) {
                            var newNode = createNode(i, node, children[i]);
                            node.children.push(newNode);
                        }

                        if (_this.decorateNodeOnCreate === undefined) {
                            node.selectableChildren = new selectable(node.children);
                        } else {
                            _this.decorateNodeOnCreate(node);
                        }


                        if (callback !== undefined) {
                            callback(node);
                        }
                    }, function (error) {
                        node.loading = false;
                        node.error = error;
                        node.children = undefined;

                        if (callback !== undefined) {
                            callback(node);
                        }
                    });
                } else {
                    // already expanded
                    if (callback !== undefined) {
                        callback(node);
                    }
                }


            }
        }

        function expandAllAsync(node, callback) {
            if (!node.leaf) {
                expandNodeAsync(node, function (nn) {
                    var count = 0;
                    for (var i = 0; i < nn.children.length; i++) {
                        var child = nn.children[i];
                        expandAllAsync(child, function () {
                            count++;
                            if (count === nn.children.length) {
                                callback();
                            }
                        });
                    }
                });

            } else {
                callback();
            }
        }

        function collapseAll(node) {
            if (node === undefined) {
                node = _this.rootNode;
            }
            collapseAllPrivate(node);

            recomputeArrayOfVisibleNodes();
        }

        function collapseAllPrivate(node) {
            if (node.leaf) {
                return;
            }

            node.expanded = false;
            if (node.children === undefined) {
                return;
            }
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];

                collapseAllPrivate(child);
            }

        }

        // private
        function findNextInParent(nn) {
            var current = nn;
            var found = undefined;
            while (found === undefined) {
                var current = getParent(current);
                if (current === undefined) {
                    break; // root node
                }

                var indexInParent = current.path[current.path.length - 1];
                var nextIndexInParent = indexInParent + 1;

                var currentParent = getParent(current);
                if (currentParent === undefined || currentParent.children.length === nextIndexInParent) {
                    continue;
                } else {
                    found = currentParent.children[nextIndexInParent];
                    break;
                }
            }
            return found;
        }


        function nextNode(node, callback) {
            if (node === undefined) {
                callback(rootNode);
                return;
            }

            var nodeParent = getParent(node);
            if (node.leaf) {
                if (nodeParent === undefined) {
                    callback(undefined); // root without an children
                    return;
                }
            }

            var indexInParent = node.path[node.path.length - 1];
            var nextIndexInParent = indexInParent + 1;
            if (node.leaf) {
                if (nodeParent.children.length === nextIndexInParent) {
                    callback(findNextInParent(node));
                } else {
                    // return next child
                    callback(nodeParent.children[nextIndexInParent]);
                    return;
                }
            } else {
                // not leaf
                expandNodeAsync(node, function (nn) {
                    if (nn.children !== undefined && nn.children.length > 0) {
                        // return first child
                        callback(nn.children[0]);
                        return;
                    }

                    // find next in parent
                    callback(findNextInParent(nn));
                });
            }

        }

        function collapseNode(node) {
            node.expanded = false;
            recomputeArrayOfVisibleNodes();
        }

        function toggleExpandNode(node) {
            if (node.expanded === false) {
                expandNode(node);
            } else {
                collapseNode(node);
            }
        }

        function toggleAndSelectExpandNode(node) {
            toggleExpandNode(node);
            selectNode(node);
        }

        function selectNodeAndExpandParent(node) {
            selectNode(node);

            expandNode(getParent(node));
        }

        function collectExpandedNodesWithLeafs(currNode, resArray) {
            resArray.push(currNode);
            if (currNode.expanded) {
                for (var i = 0; i < currNode.children.length; i++) {
                    var node = currNode.children[i];
                    collectExpandedNodesWithLeafs(node, resArray);
                }
            }
        }

        function recomputeArrayOfVisibleNodes() {
            var res = [];
            collectExpandedNodesWithLeafs(rootNode, res);
            rootNode.expandedNodesAndLeafs = res;
            return res;
        }


        var rootNode = createNode(-1, undefined, root);

        recomputeArrayOfVisibleNodes();

        // public members


        this.rootNode = rootNode;

        // public methods

        function fireChangeSelectionEventDefault(oldSelectedObject, newSelectedObject) {
            console.log('node selection:', oldSelectedObject, ';', newSelectedObject);
        }

        /**
         * @ngdoc method
         * @name fireChangeSelectionEvent
         * @propertyOf ng-puremodels.service:tree
         *
         * @description
         * function to invoke on change node selection event
         */
        this.fireChangeSelectionEvent = fireChangeSelectionEventDefault;

        /**
         * @ngdoc method
         * @name expandNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * expand node if it was not expanded
         *
         * @param {node} node to expand
         */
        this.expandNode = expandNode;

        /**
         * @ngdoc method
         * @name expandNodeAsync
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * expand node if it was not expanded, with callback
         *
         * @param {node} node to expand
         * @param {callback} function to call when children are loaded
         */
        this.expandNodeAsync = expandNodeAsync;

        /**
         * @ngdoc method
         * @name expandNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * collapse node if it was expanded
         */
        this.collapseNode = collapseNode;

        /**
         * @ngdoc method
         * @name toggleExpandNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * toggle collapse state
         */
        this.toggleExpandNode = toggleExpandNode;

        /**
         * @ngdoc method
         * @name selectNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * mark node as a selected
         *
         * @param {node} some node to select
         */
        this.selectNode = selectNode;

        /**
         * @ngdoc method
         * @name unselectNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * mark node as a unselect
         *
         * @param {node} some node to select
         */
        this.unselectNode = unselectNode;

        /**
         * @ngdoc method
         * @name getLastNodeByPath
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * return last node in path
         *
         * @param {array} path to node like [0, 2, 3]
         * @return {Object} tree node
         */
        this.getLastNodeByPath = getLastNodeByPath;

        /**
         * @ngdoc method
         * @name getNodesByPath
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * return all node in path
         *
         * @param {array} path to node like [0, 2, 3]
         * @return {array} tree node
         */
        this.getNodesByPath = getNodesByPath;

        /**
         * @ngdoc method
         * @name getNodesBySelectedPath
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * return all nodes in path to selected node
         *
         * @return {array} tree nodes
         */
        this.getNodesBySelectedPath = getNodesBySelectedPath;

        /**
         * @ngdoc method
         * @name toggleAndSelectExpandNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * convinience method: toggle and select node
         *
         * @param {node} node to toggle and select
         */
        this.toggleAndSelectExpandNode = toggleAndSelectExpandNode;

        /**
         * @ngdoc method
         * @name selectNodeAndLoadChildren
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * convinience method: select node and load its children if not yet loaded
         *
         * @param {node} node to toggle and select
         */
        this.selectNodeAndLoadChildren = selectNodeAndLoadChildren;

        /**
         * @ngdoc method
         * @name selectNodeAndExpandParent
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * convinience method: select node and expand parent
         *
         * @param {node} node to toggle and select
         */
        this.selectNodeAndExpandParent = selectNodeAndExpandParent;

        /**
         * @ngdoc method
         * @name selectNodeAndLoadChildren
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * convinience method: select node and load its children if not yet loaded
         *
         * @param {node} node to toggle and select
         * @param {callback} function to call when done
         */
        this.loadNodeChildrenAsync = loadNodeChildrenAsync;

        /**
         * @ngdoc method
         * @name decorateNodeOnCreate
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * add more data on node when children are ready: for example create 'selectable' or 'paging'
         * if not specified, create 'selectableChildren' as 'selectable'
         * @param {node} node to decorate
         */
        this.decorateNodeOnCreate = decorateNodeOnCreate;

        /**
         * @ngdoc method
         * @name getSelectedNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * return selected node or undefined
         *
         */
        this.getSelectedNode = getSelectedNode;

        /**
         * @ngdoc method
         * @name getSelectedNodeId
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * return selected node Id or undefined
         *
         */
        this.getSelectedNodeId = getSelectedNodeId;

        // utility methods
        /**
         * @ngdoc method
         * @name nextNode
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * go to next node, up to the tree. If current node has children, go to first child
         * if not, go next child in same parent node. When last child, return to node after parent node.
         * Usefull to traverse tree.
         *
         * @param {node} node to toggle and select
         * @param {callback} function to call when done with next node as a parameter
         */
        this.nextNode = nextNode;

        /**
         * @ngdoc method
         * @name expandAllAsync
         * @methodOf ng-puremodels.service:tree
         *
         * @description
         * expand all nodes. Should be used carefully due to performance
         *
         * @param {node} node to expand all sub nodes
         * @param {callback} function to call when done
         */
        this.expandAllAsync = expandAllAsync;

        this.collapseAll = collapseAll;

        // add/remove/move
        this.addNode = addNode;
        this.dropNodeOnAnotherNode = dropNodeOnAnotherNode;
        this.deleteNode = deleteNode;
        this.resetNode = resetNode;
        this.getParent = getParent;
    }

    return result;
}]);

angular.module('ng-puremodels').directive('iconGroupButton', function () {
    return {
        restrict: 'AEC',
        scope: {
            actions: '=',
            btnGroupClasses : '='
        },
        link : function(scope, element, attrs) {

        },
        templateUrl: 'dev/directives/group_button.html'
    }
});

angular.module('ng-puremodels').directive('iconButton', function () {
    return {
        restrict: 'AEC',
        scope: {
            action: '=',
            btnClasses: '=',
            iconClasses: '='
        },
        link : function(scope, element, attrs) {

            //console.log('in link: controller:', scope);
            // later
        },
        templateUrl: 'dev/directives/button.html'
    }
});

angular.module('ng-puremodels').directive('sortTh', function () {
    return {
        scope: {
            sorting: '=',
            pname : '='
        },
        templateUrl: 'dev/directives/sort-th.html'
    }
});

angular.module('ng-puremodels').filter('pager', function(){

    return function(items, page, pageSize){

        var arrayToReturn = [];
        for (var i=0; i<items.length; i++){
            if (i >= page*pageSize && i < (page+1)*pageSize) {
                arrayToReturn.push(items[i]);
            }
        }

        return arrayToReturn;
    };
}).filter('limitTo', function(){

    return function(items, limitTo){

        var arrayToReturn = [];
        for (var i=0; i<items.length; i++){
            if (i < limitTo) {
                arrayToReturn.push(items[i]);
            }
        }

        return arrayToReturn;
    };
}).filter('range', function(){

    return function(items, from, to){

        var arrayToReturn = [];
        for (var i=0; i<items.length; i++){
            if (i >= from && i <= to) {
                arrayToReturn.push(items[i]);
            }
        }

        return arrayToReturn;
    };
}).filter('offset', function(){

    return function(items, offset, pageSize){

        var arrayToReturn = [];
        for (var i=0; i<items.length; i++){
            if (i >= offset && i <= offset+pageSize) {
                arrayToReturn.push(items[i]);
            }
        }

        return arrayToReturn;
    };
}).filter('last', function(){

    return function(items, last){

        var arrayToReturn = [];
        for (var i=0; i<items.length; i++){
            if (i > items.length - last) {
                arrayToReturn.push(items[i]);
            }
        }

        return arrayToReturn;
    };
});