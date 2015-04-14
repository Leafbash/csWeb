module Indicators { export var html = '<div>    <style>        .indicator-list        {            list-style:none;            padding-left:0;        }        .indicator-group{            position: relative;            cursor:pointer;        }        /*sparkline*/        .indicator-sparkline-group {                              height: 75px;         }            .indicator-sparkline-title{            font-size:20px;            font-weight:bold;        }        .indicator-sparkline-value{            font-size: 20px;            font-weight: bold;            right: 5px;            position: absolute;            bottom:5px;        }        /*circular*/        .indicator-circular-group {                              height: 100px;         }            .indicator-circular-title{            font-size:20px;            font-weight:bold;        }        .indicator-circular-value{            font-size: 20px;            font-weight: bold;            right: 5px;            position: absolute;            bottom:5px;        }        .isActive{            background-color:yellow;        }           </style>    <div>{{data.title}}</div>    <ul class="indicator-list" data-ng-repeat="i in data.indicators" ng-switch on="i.visual">        <li ng-class="{isActive : i.isActive}" class="indicator-group indicator-sparkline-group" ng-click="vm.selectIndicator(i)" ng-switch-when="sparkline">            <div class="indicator-sparkline-title">{{i.title}}</div>            <div class="indicator-sparkline-value">{{i.sensorSet.activeValue}}</div>        </li>        <li ng-class="{isActive : i.isActive}" class="indicator-group indicator-circular-group" ng-switch-when="circular">            <div class="indicator-circular-title">{{i.title}}</div>            <div class="indicator-circular-value">{{i.activeValue}}</div>        </li>        <li ng-class="{isActive : i.isActive}" class="indicator-group" ng-switch-default>            <div>{{i.title}}</div>            <div>{{i.sensorSet.activeValue}}</div>        </li>    </ul></div>'; }