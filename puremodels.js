angular.module('ng-puremodels', []);

angular.module('ng-puremodels').factory('selectableList', function () {
    var res = function (someList) {
        var _this = this;
        var list = someList.slice(0);

        var selectedIndex = -1;
        var selectedObject = undefined;


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

        function fireChangeSelectionEventDefault(oldSelectedObject, newSelectedObject, oldSelectedIndex, newSelectedIndex) {
            console.log('selection:', oldSelectedObject, ';', newSelectedObject, ';', oldSelectedIndex, ';', newSelectedIndex);
        }

        // public methods
        this.getSelectedIndex = getSelectedIndex;
        this.getList = getList;
        this.selectIndex = selectIndex;
        this.unselectIndex = unselectIndex;
        this.toggleIndex = toggleIndex;
        this.fireChangeSelectionEvent = fireChangeSelectionEventDefault;

    }

    return res;
});


angular.module('ng-puremodels').factory('tree', function () {
    var res = function (someObject, provider) {
        var root = someObject;
        var selectedNode = undefined;


        var provider = provider;
        if (provider === undefined) {
            provider = {
                isLeaf: function (obj) {
                    return obj.children === undefined;
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
            node.expanded = true;
            if (!node.leaf) {
                if (node.children === undefined) {
                    res.loading = true;
                    provider.getChildren(node.data, function (children) {
                        res.loading = false;
                        node.children = [];
                        for (var i = 0; i < children.length; i++) {
                            var newNode = createNode(i, node, children[i]);
                            node.children.push(newNode);
                        }
                    }, function (error) {
                        res.loading = false;
                        node.children = undefined;
                    });
                }

                recomputeArrayOfVisibleNodes();
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
        this.expandNode = expandNode;
        this.collapseNode = collapseNode;
        this.toggleExpandNode = toggleExpandNode;
        this.selectNode = selectNode;
        this.unselectNode = unselectNode;
        this.getLastNodeByPath = getLastNodeByPath;
        this.getNodesByPath = getNodesByPath;
        this.toggleAndSelectExpandNode = toggleAndSelectExpandNode;

        this.getSelectedNode = getSelectedNode;
        this.getSelectedNodeId = getSelectedNodeId;


    }

    return res;
});
