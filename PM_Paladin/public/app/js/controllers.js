'use strict';

var app = angular.module('xenon.controllers', []);

app.controller('LoginCtrl', function($scope, $rootScope)
	{
		$rootScope.isLoginPage        = true;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = false;
	});

app.controller('LoginLightCtrl', function($scope, $rootScope)
	{
		$rootScope.isLoginPage        = true;
		$rootScope.isLightLoginPage   = true;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = false;
	});

app.controller('LockscreenCtrl', function($scope, $rootScope)
	{
		$rootScope.isLoginPage        = false;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = true;
		$rootScope.isMainPage         = false;
	});

app.controller('MainCtrl', function($scope, $rootScope, $location, $layout, $layoutToggles, $pageLoadingBar, Fullscreen)
	{
		$rootScope.isLoginPage        = false;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = true;

		$rootScope.layoutOptions = {
			horizontalMenu: {
				isVisible		: false,
				isFixed			: true,
				minimal			: false,
				clickToExpand	: false,

				isMenuOpenMobile: false
			},
			sidebar: {
				isVisible		: true,
				isCollapsed		: false,
				toggleOthers	: true,
				isFixed			: true,
				isRight			: false,

				isMenuOpenMobile: false,

				// Added in v1.3
				userProfile		: true
			},
			chat: {
				isOpen			: false,
			},
			settingsPane: {
				isOpen			: false,
				useAnimation	: true
			},
			container: {
				isBoxed			: false
			},
			skins: {
				sidebarMenu		: '',
				horizontalMenu	: '',
				userInfoNavbar	: ''
			},
			pageTitles: true,
			userInfoNavVisible	: false
		};

		$layout.loadOptionsFromCookies(); // remove this line if you don't want to support cookies that remember layout changes


		$scope.updatePsScrollbars = function()
		{
			var $scrollbars = jQuery(".ps-scrollbar:visible");

			$scrollbars.each(function(i, el)
			{
				if(typeof jQuery(el).data('perfectScrollbar') == 'undefined')
				{
					jQuery(el).perfectScrollbar();
				}
				else
				{
					jQuery(el).perfectScrollbar('update');
				}
			})
		};


		// Define Public Vars
		public_vars.$body = jQuery("body");


		// Init Layout Toggles
		$layoutToggles.initToggles();


		// Other methods
		$scope.setFocusOnSearchField = function()
		{
			public_vars.$body.find('.search-form input[name="s"]').focus();

			setTimeout(function(){ public_vars.$body.find('.search-form input[name="s"]').focus() }, 100 );
		};


		// Watch changes to replace checkboxes
		$scope.$watch(function()
		{
			cbr_replace();
		});

		// Watch sidebar status to remove the psScrollbar
		$rootScope.$watch('layoutOptions.sidebar.isCollapsed', function(newValue, oldValue)
		{
			if(newValue != oldValue)
			{
				if(newValue == true)
				{
					public_vars.$sidebarMenu.find('.sidebar-menu-inner').perfectScrollbar('destroy')
				}
				else
				{
					public_vars.$sidebarMenu.find('.sidebar-menu-inner').perfectScrollbar({wheelPropagation: public_vars.wheelPropagation});
				}
			}
		});


		// Page Loading Progress (remove/comment this line to disable it)
		$pageLoadingBar.init();

		$scope.showLoadingBar = showLoadingBar;
		$scope.hideLoadingBar = hideLoadingBar;


		// Set Scroll to 0 When page is changed
		$rootScope.$on('$stateChangeStart', function()
		{
			var obj = {pos: jQuery(window).scrollTop()};

			TweenLite.to(obj, .25, {pos: 0, ease:Power4.easeOut, onUpdate: function()
			{
				$(window).scrollTop(obj.pos);
			}});
		});


		// Full screen feature added in v1.3
		$scope.isFullscreenSupported = Fullscreen.isSupported();
		$scope.isFullscreen = Fullscreen.isEnabled() ? true : false;

		$scope.goFullscreen = function()
		{
			if (Fullscreen.isEnabled())
				Fullscreen.cancel();
			else
				Fullscreen.all();

			$scope.isFullscreen = Fullscreen.isEnabled() ? true : false;
		}
	});

app.controller('SidebarMenuCtrl', function($scope, $rootScope, $menuItems, $timeout, $location, $state, $layout)
	{

		// Menu Items
		var $sidebarMenuItems = $menuItems.instantiate();

		$scope.menuItems = $sidebarMenuItems.prepareSidebarMenu().getAll();

		// Set Active Menu Item
		$sidebarMenuItems.setActive( $location.path() );

		$rootScope.$on('$stateChangeSuccess', function()
		{
			$sidebarMenuItems.setActive($state.current.name);
		});

		// Trigger menu setup
		public_vars.$sidebarMenu = public_vars.$body.find('.sidebar-menu');
		$timeout(setup_sidebar_menu, 1);

		ps_init(); // perfect scrollbar for sidebar
	});

app.controller('UIModalsTopCtrl', function($scope, $rootScope, $modal, $sce)
	{
		// Used to be done as a function in app.js state('app')
		$rootScope.isLoginPage        = false;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = true;
		
		// Open Simple Modal
		$scope.openModal = function(modal_id, modal_size, modal_backdrop)
		{
			$rootScope.currentModal = $modal.open({
				templateUrl: modal_id,
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop
			});
		};

		// Loading AJAX Content
		$scope.openAjaxModal = function(modal_id, url_location)
		{
			$rootScope.currentModal = $modal.open({
				templateUrl: modal_id,
				resolve: {
					ajaxContent: function($http)
					{
						return $http.get(url_location).then(function(response){
							$rootScope.modalContent = $sce.trustAsHtml(response.data);
						}, function(response){
							$rootScope.modalContent = $sce.trustAsHtml('<div class="label label-danger">Cannot load ajax content! Please check the given url.</div>');
						});
					}
				}
			});

			$rootScope.modalContent = $sce.trustAsHtml('Modal content is loading...');
		}
	});

app.controller('DashboardCtrl', function($scope)
	{
		$scope.upcomingTools = [{
			toolID: '1393',
			toolName: 'Tool_1',
			personInCharge: 'Isadora Duncan',
			days: '14'
		},
		{
			toolID: '2394',
			toolName: 'Tool_2',
			personInCharge: 'Juan Pachanga',
			days: '7'
		},
		{
			toolID: '3395',
			toolName: 'Tool_3',
			personInCharge: 'Pablo Pueblo',
			days: '1'
		}];
	});

app.controller('MaintConfCtrl', function($scope, $http)
	{
		$http.get('../../api/confirmtasks')
		.success(function (data) {
			$scope.tasks = data;
		}).error(function (data, status) {
			alert();
		});

		$scope.selection = [];

		$scope.toggleSelection = function (item) {
			var index = $scope.selection.indexOf(item);

			if (index > -1) {
				$scope.selection.splice(index, 1);
			}
			else {
				$scope.selection.push(item);
			}
		};

		$scope.uncheckBoxes = function () {
			angular.forEach($scope.selection, function (item) {
				item.Selected = false;
			})
		};

		$scope.sendEmail = function (type) {
			console.log("TEST");
	        //Request
	        if (type == "partial") {
	        	console.log("Partial");
	        	
		        $http.post('../../api/partial', $scope.selection) 
		        .success(function(data, status) {
		            console.log("Sent ok");
		        })
		        .error(function(data, status) {
		            console.log("Error");
		        });
		    }
		    else {
		    	console.log("Full");
		    	
		    	$http.post('../../api/full', $scope.selection) 
		        .success(function(data, status) {
		            console.log("Sent ok");
		        })
		        .error(function(data, status) {
		            console.log("Error");
		        });
		    }
		};

	});

app.controller('MaintApprCtrl', function($scope, $http)
	{

		$scope.selection = [];
		$http.get('../../api/approvetasks')
		.success(function (data) {
			$scope.tasks = data;
		}).error(function (data, status) {
			alert();
		});

		$scope.toggleSelection = function (item) {
			var index = $scope.selection.indexOf(item);

			if (index > -1) {
				$scope.selection.splice(index, 1);
			}
			else {
				$scope.selection.push(item);
			}
		};

		$scope.uncheckBoxes = function () {
			angular.forEach($scope.selection, function (item) {
				item.Selected = false;
			})
		};

		$scope.sendEmail = function () {
			
			console.log("sendEmail from controller.js");
	        //Request
	        $http.post('../../api/approve', $scope.selection) 
	        .success(function(data, status) {
	            console.log("Sent ok");
	        })
	        .error(function(data, status) {
	            console.log("Error");
	        })
		};

	});

app.controller('EquipmentMgmtCtrl', function($scope)
	{
		$scope.selectedLine = null;  // initialize our variable to null
		$scope.setClickedLine = function(index){  //function that sets the value of selectedRow to current index
		    $scope.selectedLine = index;
		    $scope.selectedWS = null;  //para evitar que se guarde la seleccion de ws
		}

		$scope.selectedWS = null;  // initialize our variable to null
		$scope.setClickedWS = function(index){  //function that sets the value of selectedRow to current index
		    $scope.selectedWS = index;
		   	$scope.selectedTool = null;

		}

		$scope.selectedTool = null;  // initialize our variable to null
		$scope.setClickedTool = function(index){  //function that sets the value of selectedRow to current index
		    $scope.selectedTool = index;
		}

		$scope.lines = [{
			"lineID": 1,
			"lineName": 'Line_1',
		},
		{
			lineID: 2,
			lineName: 'Line_2',
		}];

		$scope.workstations = [{
			lineID: 1,
			wsID: 1.1,
			wsName: 'WS_1',
		},
		{
			lineID: 1,
			wsID: 1.2,
			wsName: 'WS_2',
		},
		{
			lineID: 1,
			wsID: 1.3,
			wsName: 'WS_5',
		},
		{
			lineID: 2,
			wsID: 2.1,
			wsName: 'WS_3',
		},
		{
			lineID: 2,
			wsID: 2.2,
			wsName: 'WS_4',
		}];

		$scope.tools = [{
			wsID: 1.1,
			toolID: '1.1.1',
			toolName: 'Tool_1',
		},
		{
			wsID: '1.1',
			toolID: '1.1.2',
			toolName: 'Tool_2',
		},
		{
			wsID: '1.2',
			toolID: '1.2.1',
			toolName: 'Tool_3',
		},
		{
			wsID: '1.2',
			toolID: '1.2.2',
			toolName: 'Tool_4',
		},
		{
			wsID: '2.1',
			toolID: '2.1.1',
			toolName: 'Tool_5',
		},
		{
			wsID: '2.1',
			toolID: '2.1.2',
			toolName: 'Tool_6',
		},
		{
			wsID: '2.2',
			toolID: '2.2.1',
			toolName: 'Tool_7',
		},
		{
			wsID: '2.2',
			toolID: '2.2.2',
			toolName: 'Tool_8',
		}];
	});

app.controller('UserMgmtCtrl', function($scope, $http, $modal)
	{	
		$scope.employeeTypes = ['Administrator', 'Engineer', 'Technician'];
		$scope.selection = [];
		$scope.userInfo = {
			'sso': '',
			'firstName': '',
			'lastName': '',
			'email': '',
			'password': '',
			'employeeType': $scope.selection
		};
		$scope.selectedUser = {};
		$scope.modalInstance = {};

		$http.get('../../api/employees')
		.success(function (data) {
			$scope.users = data;
		}).error(function (data, status) {
			alert();
		});


		$scope.toggleSelection = function (item) {
			var index = $scope.selection.indexOf(item);

			if (index > -1) {
				$scope.selection.splice(index, 1);
			}
			else {
				$scope.selection.push(item);
			}
		};

		$scope.checkSelectedUser = function (userIndex) {
			$scope.selectedUser = $scope.users[userIndex];
			console.log($scope.selectedUser);
		};

		$scope.sendEmail = function () {
			console.log($scope.userInfo);
			console.log("sendEmail from controller.js");
	        
	        //Request
	        $http.post('../../api/newUser', $scope.userInfo) 
	        .success(function(data, status) {
	            console.log("Sent ok");
	        })
	        .error(function(data, status) {
	            console.log("Error");
	        });
		};

		$scope.myOpenModal = function(modal_id, modal_size, modal_backdrop){
			console.log("myOpenModal");
			$scope.modalInstance = $modal.open({
				templateUrl: modal_id,
				controller: 'UpdateUserModalCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				resolve: {
					selectedUser: function(){return $scope.selectedUser;}
				}
			});
		};
	});

app.controller('UpdateUserModalCtrl', function($scope, $modalInstance, selectedUser)
{
	console.log("UpdateUserModalCtrl");
	$scope.selectedUser = selectedUser;

	$scope.close = function(){
		$modalInstance.close();
	};

});
	// $scope.users = [{
	// 		empID: 1,
	// 		empFirstName: 'Isadora',
	// 		empLastName: 'Duncan',
	// 		empPosition: 'Admin',
	// 		empEmail: 'isadora.duncan@ge.com',
	// 		empPass: 'celia',
	// 	},
	// 	{
	// 		empID: 2,
	// 		empFirstName: 'Juan',
	// 		empLastName: 'Pachanga',
	// 		empPosition: 'Engineer',
	// 		empEmail: 'juan.pachanga@ge.com',
	// 		empPass: 'ruben',
	// 	},
	// 	{
	// 		empID: 3,
	// 		empFirstName: 'Pablo',
	// 		empLastName: 'Pueblo',
	// 		empPosition: 'Technician',
	// 		empEmail: 'pablo.pablo@ge.com',
	// 		empPass: 'blades',
	// 	},
	// 	{
	// 		empID: 4,
	// 		empFirstName: 'Maximo',
	// 		empLastName: 'Chamorro',
	// 		empPosition: 'Engineer',
	// 		empEmail: 'maximo.chamorro@ge.com',
	// 		empPass: 'blades',
	// 	}];


		// this.selectedUserID = null;
		// var selectedUserPosition = "";
		// var userIndex = "";


		// function getUserIndex() {
		// 	for (var i=0; i < users.length; i++) {
		// 		if (selectedUserID == users[i].empID) {
		// 			var userIndex = i;
		// 			selectedUserPosition = users[i].empPosition;
		// 			console.log("user index: " + userIndex);
		// 			console.log("user position: " + selectedUserPosition);
		// 		} 
		// 	}
		// 	selectedUserIndex = userIndex;
		// 	return userIndex;
		// };

		// $scope.getUserPosition = function () {
		// 	return $scope.users[getUserIndex()].empPosition;;
		// };
		// selectedUserIndex = getUserIndex();





		// var isAdmin = true;
		// var isEngineer = false;
		// var isTechnician = false;
		// var isType = false	

		// checkType = function () {

		// 	// $scope.position = $scope.selectedUserIndex;
		// 	// console.log($scope.selectedUserPosition);

		// 	if (selectedUserPosition == 'Admin') {
		// 		console.log("entre a admin");
		// 		return true;
		// 	}
		// 	else if (selectedUserPosition == 'Engineer') {
		// 		console.log("entre a eng");
		// 		return true;
		// 	}
		// 	else if (selectedUserPosition == 'Technician') {
		// 		console.log("entre a tec");
		// 		return true;
		// 	}
		// 	else{
		// 		console.log("entre a nada");
		// 		return false;
		// 	}	
		// }
	

		


	