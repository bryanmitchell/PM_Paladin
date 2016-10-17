'use strict';

angular.module('xenon.controllers', []).
	controller('LoginCtrl', function($scope, $rootScope)
	{
		$rootScope.isLoginPage        = true;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = false;
	}).
	controller('LoginLightCtrl', function($scope, $rootScope)
	{
		$rootScope.isLoginPage        = true;
		$rootScope.isLightLoginPage   = true;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = false;
	}).
	controller('LockscreenCtrl', function($scope, $rootScope)
	{
		$rootScope.isLoginPage        = false;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = true;
		$rootScope.isMainPage         = false;
	}).
	controller('MainCtrl', function($scope, $rootScope, $location, $layout, $layoutToggles, $pageLoadingBar, Fullscreen)
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
	}).
	controller('SidebarMenuCtrl', function($scope, $rootScope, $menuItems, $timeout, $location, $state, $layout)
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
	}).
	controller('UIModalsTopCtrl', function($scope, $rootScope, $modal, $sce)
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
	}).
	controller('DashboardCtrl', function($scope)
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
	}).
	controller('UserMgmtCtrl', function($scope)
	{
		$scope.users = [{
			empID: '1',
			empName: 'Isadora Duncan',
			empPosition: 'Admin'
		},
		{
			empID: '2',
			empName: 'Juan Pachanga',
			empPosition: 'Engineer'
		},
		{
			empID: '3',
			empName: 'Pablo Pueblo',
			empPosition: 'Technician'
		}];
	}).
	controller('MaintConfCtrl', function($scope)
	{
		$scope.tools = [{
			toolID: '1',
			toolName: 'Tool_1',
			line: 'Welding Line',
			confStatus: 'Y'
		},
		{
			toolID: '2',
			toolName: 'Tool_2',
			line: 'Assembly Line',
			confStatus: 'Y'
		},
		{
			toolID: '3',
			toolName: 'Tool_3',
			line: 'Testing Line',
			confStatus: 'N'
		}];
	}).
	controller('MaintApprCtrl', function($scope)
	{
		$scope.tools = [{
			toolID: '1',
			toolName: 'Tool_1',
			personInCharge: 'Isadora Duncan',
		},
		{
			toolID: '2',
			toolName: 'Tool_2',
			personInCharge: 'Juan Pachanga',
		},
		{
			toolID: '3',
			toolName: 'Tool_3',
			personInCharge: 'Pablo Pueblo',
		}];
	}).
	controller('EquipmentMgmtCtrl', function($scope)
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
			lineID: '1',
			lineName: 'Line_1',
		},
		{
			lineID: '2',
			lineName: 'Line_2',
		}];

		$scope.workstations = [{
			lineID: '1',
			wsID: '1.1',
			wsName: 'WS_1',
		},
		{
			lineID: '1',
			wsID: '1.2',
			wsName: 'WS_2',
		},
		{
			lineID: '1',
			wsID: '1.3',
			wsName: 'WS_5',
		},
		{
			lineID: '2',
			wsID: '2.1',
			wsName: 'WS_3',
		},
		{
			lineID: '2',
			wsID: '2.2',
			wsName: 'WS_4',
		}];

		$scope.tools = [{
			wsID: '1.1',
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