module LanguageSwitch { export var html = '<div class="navbar-collapse collapse">    <ul class="nav navbar-nav">        <li class="dropdown">            <a href=""               class="navbar-brand dropdown-toggle pull-left"               data-toggle="dropdown"               style="color:white; margin-left:-10px;">                <img data-ng-src="{{vm.language.img}}" />                <span class="caret" data-ng-if="vm.$languages.length > 1"></span>            </a>            <ul data-ng-if="vm.$languages.length > 1" class="dropdown-menu" role="menu">                <li ng-repeat="language in vm.$languages">                    <a ng-click="vm.switchLanguage(language)">                        <span>                            <img data-ng-src="{{language.img}}" />                            &nbsp;{{language.name}}                        </span>                    </a>                </li>            </ul>        </li>    </ul></div>'; }