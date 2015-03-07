// puremodels version 0.0.2
angular.module('ng-puremodels', []);

/**
 * @ngdoc service
 * @name ng-puremodels.service:selectableList
 *
 * @description
 * wrap array with select-unselect-event on select functionality
 * selection can be 'single' : only one index can be selected,
 * and 'multi' when number of elements are selected.
 *
 * Two modules of selection are not affecting each other.
 **/
angular.module('ng-puremodels').factory('selectableList', function () {
    var res = function (someList) {
        var _this = this;
        var list = someList.slice(0);

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

        function clearArray (array) {
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

        // private method
        // set selected value and fire event if value was changed
        function multiSetSelection(i, value) {
            var oldValue = multiSelections[i];
            multiSelections[i] = value;
            console.log('oldValue:', oldValue, 'value :', value);
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
         * @methodOf ng-puremodels.service:selectableList
         *
         * @description
         * return selected index in the array, or -1 if nothing selected
         *
         *
         */
        this.getSelectedIndex = getSelectedIndex;


        /**
         * @ngdoc method
         * @name selectIndex
         * @methodOf ng-puremodels.service:selectableList
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
         * @methodOf ng-puremodels.service:selectableList
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
         * @methodOf ng-puremodels.service:selectableList
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
         * @propertyOf ng-puremodels.service:selectableList
         *
         * @description
         * function to invoke on change selection event
         */
        this.fireChangeSelectionEvent = fireChangeSelectionEventDefault;

        /**
         * @ngdoc method
         * @name fireChangeMultiSelectionEvent
         * @propertyOf ng-puremodels.service:selectableList
         *
         * @description
         * function to invoke on change multi selection event
         */
        this.fireChangeMultiSelectionEvent = fireChangeMultiSelectionEventDefault;

        // multi selection

        /**
         * @ngdoc method
         * @name unselectAll
         * @methodOf ng-puremodels.service:selectableList
         *
         * @description
         * unselect all objects
         */
        this.unselectAll = unselectAll;

        /**
         * @ngdoc method
         * @name selectAll
         * @methodOf ng-puremodels.service:selectableList
         *
         * @description
         * select all objects
         */
        this.selectAll = selectAll;

        /**
         * @ngdoc method
         * @name toggleAll
         * @methodOf ng-puremodels.service:selectableList
         *
         * @description
         * toggle  all objects multi selection
         */
        this.toggleAll = toggleAll;

        /**
         * @ngdoc method
         * @name multiSelect
         * @methodOf ng-puremodels.service:selectableList
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
         * @methodOf ng-puremodels.service:selectableList
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
         * @methodOf ng-puremodels.service:selectableList
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
         * @propertyOf ng-puremodels.service:selectableList
         *
         * @description
         * array of booleans for selected states
         */
        this.multiSelections = multiSelections;

        /**
         * @ngdoc method
         * @name multiSelectedObjects
         * @propertyOf ng-puremodels.service:selectableList
         *
         * @description
         * array selected objects
         */
        this.multiSelectedObjects = multiSelectedObjects;

        /**
         * @ngdoc method
         * @name multiSelectedIndexes
         * @propertyOf ng-puremodels.service:selectableList
         *
         * @description
         * array selected indexes
         */
        this.multiSelectedIndexes = multiSelectedIndexes;
        /**
         * @ngdoc method
         * @name getList
         * @methodOf ng-puremodels.service:selectableList
         *
         * @description
         * return array of objects
         */
        this.getList = getList;

        /**
         * @ngdoc method
         * @name list
         * @propertyOf ng-puremodels.service:selectableList
         *
         * @description
         * array of objects
         */
        this.list = list;

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
angular.module('ng-puremodels').factory('tree', ['selectableList', function (selectableList) {
    var result = function (someObject, provider) {
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

        function createNode(index, parentNode, object) {
            var res = {path: [], parent: parentNode, data: object, leaf: true, loading: true, expanded: false};

            res.leaf = provider.isLeaf(object);


            if (parentNode === undefined) {
                return res;
            }

            res.path = parentNode.path.slice(0);
            res.path.push(index);

            res.id = res.path.join('-');
            return res;
        }

        function selectNode(node) {
            node.selected = true;
            selectedNode = node;


        }

        function selectNodeAndLoadChildren(node, callback) {
            node.selected = true;
            selectedNode = node;

            loadNodeChildrenAsync(node, callback);
        }

        function unselectNode(node) {
            node.selected = false;
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
            expandNodeAsync(node, function(nn) {
                recomputeArrayOfVisibleNodes();
            });
        }

        function expandNodeAsync(node, callback) {
            node.expanded = true;
            loadNodeChildrenAsync(node, callback);
        }

        function loadNodeChildrenAsync(node, callback) {
            if (callback === undefined) {
                callback = function() {};
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


                        node.selectableChildren = new selectableList(node.children);

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
                expandNodeAsync(node, function(nn) {
                    var count = 0;
                    for (var i = 0; i < nn.children.length; i++) {
                        var child = nn.children[i];
                        expandAllAsync(child, function() {
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
            console.log('collapse:', node.path);
            collapseAllPrivate(node);

            recomputeArrayOfVisibleNodes();
        }

        function collapseAllPrivate(node) {
            if (node.leaf) {
                return;
            }

            node.expanded = false;
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
                var current = current.parent;
                if (current === undefined) {
                    break; // root node
                }

                var indexInParent = current.path[current.path.length-1];
                var nextIndexInParent = indexInParent+1;

                if (current.parent === undefined || current.parent.children.length === nextIndexInParent) {
                    continue;
                } else {
                    found = current.parent.children[nextIndexInParent];
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

            if (node.leaf) {
                if (node.parent === undefined) {
                    callback(undefined); // root without an children
                    return;
                }
            }

            var indexInParent = node.path[node.path.length-1];
            var nextIndexInParent = indexInParent+1;
            if (node.leaf) {
                //console.log('leaf');
                if (node.parent.children.length === nextIndexInParent) {
                    callback(findNextInParent(node));
                } else {
                    // return next child
                    callback(node.parent.children[nextIndexInParent]);
                    return;
                }
            } else {
                // console.log('not leaf');
                // not leaf
                expandNodeAsync(node, function(nn){
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
            expandNode(node.parent);
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
            //console.log('res:',res);
            return res;
        }


        var rootNode = createNode(-1, undefined, root);

        recomputeArrayOfVisibleNodes();

        // public members


        this.rootNode = rootNode;


        // public methods

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
    }

    return result;
}]);
