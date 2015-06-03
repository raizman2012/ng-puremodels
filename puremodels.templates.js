angular.module('ng-puremodels').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('dev/directives/button.html',
    "<button ng-if=\"action.visible\"\r" +
    "\n" +
    "        class=\"{{action.btnClasses}} {{btnClasses}}\"\r" +
    "\n" +
    "        ng-click=\"action.invoke()\"\r" +
    "\n" +
    "        ng-disabled=\"action.disable\">\r" +
    "\n" +
    "    <i class=\"{{action.iconClasses}} {{iconClasses}}\"></i>\r" +
    "\n" +
    "    <span translate>{{action.text}}</span>\r" +
    "\n" +
    "</button>"
  );


  $templateCache.put('dev/directives/group_button.html',
    "<div class=\"btn-group {{btnGroupGlasses}}\" role=\"group\" >\r" +
    "\n" +
    "    <button ng-repeat=\"action in actions\"\r" +
    "\n" +
    "            class=\"{{action.btnClasses}}\"\r" +
    "\n" +
    "            ng-click=\"action.invoke()\"\r" +
    "\n" +
    "            ng-disable=\"action.state\">\r" +
    "\n" +
    "        <i class=\"{{action.iconClasses}}\"></i>\r" +
    "\n" +
    "        <span translate>{{action.text}}</span>\r" +
    "\n" +
    "    </button>\r" +
    "\n" +
    "</div>"
  );


  $templateCache.put('dev/directives/sort-th.html',
    "<span ng-click=\"sorting.sortToggle(pname)\"\r" +
    "\n" +
    "      style=\"height : inherit; line-height: inherit\" class=\"pull-right fa-stack\">\r" +
    "\n" +
    "   <i class=\"fa fa-sort fa-stack-1x\"></i>\r" +
    "\n" +
    "   <i class=\"fa fa-stack-1x ng-class:sorting.getStatusVerbose(pname, ['text-danger fa-sort-asc', 'fa-sort', 'text-primary fa-sort-desc'])\"></i>\r" +
    "\n" +
    "</span>"
  );

}]);
