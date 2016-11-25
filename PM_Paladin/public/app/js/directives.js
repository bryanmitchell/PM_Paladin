angular.module('xenon.directives', []).

	//Verify confirm password matches password
	directive('passwordVerify', function () {
		return {
			require: "ngModel",
			scope: {
				passwordVerify: '='
			},
			link: function(scope, element, attrs, ctrl) {
				scope.$watch(function() {
					var combined;
					
					if (scope.passwordVerify || ctrl.$viewValue) {
					   combined = scope.passwordVerify + '_' + ctrl.$viewValue; 
					} 
					return combined;
				}, function(value) {
					if (value) {
						ctrl.$parsers.unshift(function(viewValue) {
							var origin = scope.passwordVerify;
							if (origin !== viewValue) {
								ctrl.$setValidity("passwordVerify", false);
								return undefined;
							} else {
								ctrl.$setValidity("passwordVerify", true);
								return viewValue;
							}
						});
					}
				});
			}
		};
	}).

	// Layout Related Directives
	directive('sidebarMenu', function(){
		return {
			restrict: 'E',
			templateUrl: appHelper.templatePath('layout/sidebar-menu'),
			controller: 'SidebarMenuCtrl'
		};
	}).
	directive('sidebarLogo', function(){
		return {
			restrict: 'E',
			replace: true,
			templateUrl: appHelper.templatePath('layout/sidebar-logo')
		};
	}).
	directive('userInfoNavbar', function(){
		return {
			restrict: 'E',
			replace: true,
			templateUrl: appHelper.templatePath('layout/user-info-navbar')
		};
	}).
	directive('pageTitle', function(){
		return {
			restrict: 'E',
			replace: true,
			templateUrl: appHelper.templatePath('layout/page-title'),
			link: function(scope, el, attr){
				scope.title = attr.title;
				scope.description = attr.description;
			}
		};
	}).
	directive('siteFooter', function(){
		return {
			restrict: 'E',
			templateUrl: appHelper.templatePath('layout/footer')
		};
	});