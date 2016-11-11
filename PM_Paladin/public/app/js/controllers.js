'use strict';

var app = angular.module('xenon.controllers', []);

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

app.controller('UIModalsTopCtrl', function($scope, $rootScope, $modal, $sce, $http, $location)
	{
		// Used to be done as a function in app.js state('app')
		$rootScope.isLoginPage        = false;
		$rootScope.isLightLoginPage   = false;
		$rootScope.isLockscreenPage   = false;
		$rootScope.isMainPage         = true;
		$rootScope.isLoggedIn		  = false;
		$rootScope.userPosition		  = [];
		$rootScope.buttonDisabled = false;
		$rootScope.currentPageTitle = 'Dashboard';

		$scope.logInUser = {
			'sso': '',
			'password': ''
		};

		$scope.validateLogIn = function () {
			$http.post('../../api/getEmployeePassword', $scope.logInUser) 
			.success(function(data, status) {
				$rootScope.isLoggedIn = data.success;
				if($rootScope.isLoggedIn){
					$rootScope.userPosition = data.types.split(',');
					$rootScope.userSSO = $scope.logInUser.sso;
				}
			})
			.error(function(data, status) {
				console.log("Error");
			});
		};


		$scope.showLogoutButton =function () {
			if ($rootScope.isLoggedIn == true) {
				return true;
			}
			return false;
		}

		$scope.logout = function () {
			$rootScope.isLoggedIn = false;
			$rootScope.userPosition = '';
			$scope.showLogoutButton();
			$location.path('app/dashboard').replace();
		}


		$scope.showDelete = function (menuItemTitle) {
			var isAdmin = $rootScope.userPosition.indexOf('Administrator') > -1;
			var isEng = $rootScope.userPosition.indexOf('Engineer') > -1;
			var isTech = $rootScope.userPosition.indexOf('Technician') > -1;
			switch(menuItemTitle){
				case 'Dashboard':
					return true;
				case 'Equipment Management':
					return isAdmin || isEng || isTech;
				case 'User Management':
					return isAdmin;
				case 'Maintenance Confirmation':
					return isTech;
				case 'Maintenance Approval':
					return isEng;
			}
		};

			
		
		// Open Simple Modal
		$scope.openModal = function(modal_id, modal_size, modal_backdrop)
		{
			$rootScope.currentModal = $modal.open({
				templateUrl: modal_id,
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop
			});
		};

	});



app.controller('DashboardCtrl', function($scope, $rootScope, $http)
	{

		$rootScope.currentPageTitle = 'Dashboard';

		$http.get('../../api/gettooldates')
			.success(function (data) {
				$scope.upcomingTools = data;
				console.log(data);
			}).error(function (data, status) {
				alert();
			});

		$http.get('../../api/getpiechartinfo')
			.success(function (data) {
				$scope.pieChart = data;
				console.log($scope.pieChart);
				$scope.labelsPie = getLabels();
  				$scope.dataPie = getCounts();
  				console.log($scope.labelsPie);
				console.log($scope.dataPie);

  			}).error(function (data, status) {
				alert();
			});

		var getCounts = function(){
			var result = [];
			for(var i=0; i<$scope.pieChart.length; i++){
				result.push($scope.pieChart[i].count);
			}
			// console.log(result);
			return result;
		};
		var getLabels = function(){
			var result = [];
			for(var i=0; i<$scope.pieChart.length; i++){
				result.push($scope.pieChart[i].status);
			}
			// console.log(result);
			return result;
		};

		$scope.labelsBar = ['2006', '2007', '2008', '2009', '2010', '2011', '2012']; 
		$scope.seriesBar = ['Series A', 'Series B']; 
		$scope.dataBar = [ 
			[65, 59, 80, 81, 56, 55, 40], 
			[28, 48, 40, 19, 86, 27, 90] 
		]; 

		// $scope.labelsPie = getLabels();
  // 		$scope.dataPie = getCounts();

		
		
	});

app.controller('MaintConfCtrl', function($scope, $rootScope, $http) 
	{
		$rootScope.currentPageTitle = 'Maintenance Confirmation';

		$scope.getConfirmTasks = function () {
			$http.post('../../api/confirmtasks', {'sso': $rootScope.userSSO})
			.success(function (data) {
				$scope.tasks = data;
			}).error(function (data, status) {
				alert();
			});
		};	
		
		$scope.getConfirmTasks();	

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

		$scope.confirmFull = function(){
			$http.post('../../api/confirmfull', $scope.selection)
			.success(function (data) {
				console.log('confirmFull');
			}).error(function (data, status) {
				alert();
			});
		};

		$scope.confirmPartial = function(){
			$http.post('../../api/confirmpartial', $scope.selection)
			.success(function (data) {
				console.log('confirmPartial');
			}).error(function (data, status) {
				alert();
			});
		};

		$scope.sendEmail = function (type) {
			console.log("TEST");
			//Request
			if (type == "partial") {
				console.log("Partial");
				
				$http.post('../../api/emailpartial', $scope.selection) 
				.success(function(data, status) {
					console.log("Sent ok");
				})
				.error(function(data, status) {
					console.log("Error");
				});
			}
			else {
				console.log("Full");
				
				$http.post('../../api/emailfull', $scope.selection) 
				.success(function(data, status) {
					console.log("Sent ok");
				})
				.error(function(data, status) {
					console.log("Error");
				});
			}
		};
	});

app.controller('MaintApprCtrl', function($scope, $rootScope, $http) 
	{
		$rootScope.currentPageTitle = 'Maintenance Approval';

		$scope.selection = [];

		$scope.getApproveTasks = function () {
			$http.post('../../api/approvetasks', {'sso': $rootScope.userSSO})
			.success(function (data) {
				$scope.tasks = data;
			}).error(function (data, status) {
				alert();
			});
		};
		
		$scope.getApproveTasks();

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

		$scope.approveTasks = function(){
			$http.post('../../api/approve', $scope.selection)
			.success(function (data) {
				console.log('approveTasks');
			}).error(function (data, status) {
				alert();
			});
		};

		$scope.sendEmail = function () {
			console.log("sendEmail from controller.js");
			//Request
			$http.post('../../api/emailapprove', $scope.selection) 
			.success(function(data, status) {
				console.log("Sent ok");
			})
			.error(function(data, status) {
				console.log("Error");
			});
		};
	});



app.controller('EquipmentMgmtCtrl', function($scope, $rootScope, $http, $modal, $timeout) 
	{

		$rootScope.currentPageTitle = 'Equipment Management';

		$http.get('../../api/lines') 
			.success(function(data, status) {
				$scope.lines = data;
			})
			.error(function(data, status) {
				console.log("Error");
			});

		$http.get('../../api/workstations') 
			.success(function(data, status) {
				$scope.workstations = data;
			})
			.error(function(data, status) {
				console.log("Error");
			});

		$http.get('../../api/tools') 
			.success(function(data, status) {
				$scope.tools = data;
			})
			.error(function(data, status) {
				console.log("Error");
			});



		$scope.date = new Date();
		console.log($scope.date);


		$scope.selectedLine = null;  // initialize our variable to null
		$scope.selectedWS = null;  // initialize our variable to null
		$scope.selectedTool = null;  // initialize our variable to null
		$scope.updateModal = null; //assign function to it according to what is selected

		$scope.updateLineModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: 'modal-line-update',
				controller: 'LineUpdateCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				resolve: {
					selectedLine: function(){
						for(var i=0; i<$scope.lines.length; i++){
							if($scope.lines[i].lineID == $scope.selectedLine){
								return $scope.lines[i];
							}}}
				}
			});
		};

		$scope.updateWorkstationModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: 'modal-ws-update',
				controller: 'WSUpdateCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				resolve: {
					selectedWS: function(){
						for(var i=0; i<$scope.workstations.length; i++){
							if($scope.workstations[i].wsID == $scope.selectedWS){
								return $scope.workstations[i];
							}}}
				}
			});
		};

		$scope.updateToolModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: 'modal-tool-update',
				controller: 'ToolUpdateCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				resolve: {
					selectedTool: function(){
						for(var i=0; i<$scope.tools.length; i++){
							if($scope.tools[i].toolID == $scope.selectedTool){
								return $scope.tools[i];
							}}}
				}
			});
		};

		$scope.setClickedLine = function(index){  //function that sets the value of selectedRow to current index
			$scope.selectedLine = index;
			$scope.selectedWS = null;  //para evitar que se guarde la seleccion de ws
			$scope.selectedTool = null;
			$scope.updateModal = $scope.updateLineModal;
		};
		
		$scope.setClickedWS = function(index){  //function that sets the value of selectedRow to current index
			$scope.selectedWS = index;
			$scope.selectedTool = null;
			$scope.updateModal = $scope.updateWorkstationModal;
		};

		$scope.setClickedTool = function(index){  //function that sets the value of selectedRow to current index
			$scope.selectedTool = index;
			$scope.updateModal = $scope.updateToolModal;
		};

		$rootScope.disableButton = function(){
			$rootScope.buttonDisabled=true;
			$timeout(function(){
				$rootScope.buttonDisabled=false;
			},5000);
		};

	});

app.controller('EquipmentCreateCtrl', function($scope, $http)
	{
		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.lineInfo = {
			'lineName': '',
			'remoteIoAddress': '',
			'supervisorFirstName': '',
			'supervisorLastName': '',
			'supervisorEmail': ''
		};
		$scope.remoteIoAddresses = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

		$scope.workstationInfo = {
			'workstationName': '',
			'greenLightOpcTag': '',
			'yellowLightOpcTag': '',
			'redLightOpcTag': '',
			'employeeSso': ''
		};

		$scope.toolInfo = {
			'toolName': '',
			'toolType': '',
			'rfidAddress': '',
			'opcTag': '',
			'ioAddress': '',
			'employeeSso': ''
		};

		$scope.users = {}; // Just a declaration
		$scope.userInCharge = {};

		$http.get('../../api/employees')
			.success(function (data) {
				console.log("empleados");
				$scope.users = data;
				//$scope.userInCharge = $scope.users.firstName + $scope.users.lastName;
				//console.log($scope.userInCharge);
			}).error(function (data, status) {
				alert();
			});	

		$scope.createLine = function () {
			//Request
			console.log("Called createLine");
			$http.post('../../api/createline', $scope.lineInfo) 
			.success(function(data, status) {
				console.log("createline ok");
			})
			.error(function(data, status) {
				console.log("Controller createline Error");
			});
		};

		$scope.createWorkstation = function () {
			//Request
			$http.post('../../api/createworkstation', $scope.workstationInfo) 
			.success(function(data, status) {
				console.log("createworkstation ok");
			})
			.error(function(data, status) {
				console.log("Controller createworkstation Error");
			});
		};

		$scope.createTool = function () {
			//Request
			$http.post('../../api/createtool', $scope.toolInfo) 
			.success(function(data, status) {
				console.log("createtool ok");
			})
			.error(function(data, status) {
				console.log("Controller createtool Error");
			});
		};
	});

app.controller('LineUpdateCtrl', ['$scope', '$http', '$modalInstance', 'selectedLine', function($scope, $http, $modalInstance, selectedLine)
	{
		
		$rootScope.currentPageTitle = 'Equipment Management';
		
		$scope.lineInfo = selectedLine;

		$scope.updateLine = function () {
			//Request
			console.log("Called updateLine");
			$http.post('../../api/updateline', $scope.lineInfo) 
			.success(function(data, status) {
				console.log("updateLine ok");
			})
			.error(function(data, status) {
				console.log("Controller updateLine Error");
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

app.controller('WSUpdateCtrl', ['$scope', '$http', '$modalInstance', 'selectedWS', function($scope, $http, $modalInstance, selectedWS)
	{
		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.workstationInfo = selectedWS;

		$scope.updateWorkstation = function () {
			//Request
			console.log("Called updateWorkstation");
			$http.post('../../api/updateworkstation', $scope.workstationInfo) 
			.success(function(data, status) {
				console.log("updateWorkstation ok");
			})
			.error(function(data, status) {
				console.log("Controller updateWorkstation Error");
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

app.controller('ToolUpdateCtrl', ['$scope', '$http', '$modalInstance', 'selectedTool', function($scope, $http, $modalInstance, selectedTool)
	{
		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.toolInfo = selectedTool;

		$scope.updateTool = function () {
			//Request
			console.log("Called updateTool");
			$http.post('../../api/updatetool', $scope.toolInfo) 
			.success(function(data, status) {
				console.log("updateTool ok");
			})
			.error(function(data, status) {
				console.log("Controller updateTool Error");
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);




app.controller('UserMgmtCtrl', function($scope, $http, $modal) 
	{	
		$rootScope.currentPageTitle = 'User Management';

		$scope.employeeTypes = ['Administrator', 'Engineer', 'Technician'];
		$scope.ssos = [3, 4, 5, 6, 7, 8, 9, 10]; // To be replaced with a read from Luis's SSO file
		$scope.selection = []; // Binded to selected user roles in create user modal
		$scope.userInfo = {
			'sso': '',
			'firstName': '',
			'lastName': '',
			'email': '',
			'password': '',
			'employeeType': $scope.selection
		}; // Binded to Create User Modal fields
		$scope.selectedUser = {}; // User (obtained from DB) to pass to Update User modal
		
		$scope.users = {}; // Just a declaration
		$scope.confirmPassword = '';

		$scope.getEmployees = function(){
			$http.get('../../api/employees')
			.success(function (data) {
				$scope.users = data;
			}).error(function (data, status) {
				alert();
			});	
		};

		$scope.getEmployees();

		$scope.toggleSelection = function (item) {
			var index = $scope.selection.indexOf(item);

			if (index > -1) {
				$scope.selection.splice(index, 1);
			}
			else {
				$scope.selection.push(item);
			}
		};

		$scope.checkSelectedUser = function (sso) {
			for(var i=0; i<$scope.users.length; i++){
				if($scope.users[i].sso == sso){
					$scope.selectedUser = $scope.users[i];
				}
			}
		};

		$scope.createEmployee = function () {
			console.log("createEmployee from controller.js")

			//Request
			$http.post('../../api/createemployee', $scope.userInfo) 
			.success(function(data, status) {
				console.log("User created");
				// $scope.getEmployees();
				// $scope.$apply();
			})
			.error(function(data, status) {
				console.log("Error");
			});
			$scope.getEmployees();
		}

		$scope.sendEmail = function () {
			console.log("sendEmail from controller.js");
			
			//Request
			$http.post('../../api/emailnewuser', $scope.userInfo) 
			.success(function(data, status) {
				console.log("Sent ok");
			})
			.error(function(data, status) {
				console.log("Error");
			});
		};

		$scope.updateUserModal = function(modal_id, modal_size, modal_backdrop){
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

app.controller('UpdateUserModalCtrl', ['$scope', '$http', '$modalInstance', 'selectedUser', function($scope, $http, $modalInstance, selectedUser)
	{
		$rootScope.currentPageTitle = 'User Management';

		console.log("UpdateUserModalCtrl");
		$scope.selectedUser = selectedUser;
		$scope.employeeTypes = ['Administrator', 'Engineer', 'Technician'];
		$scope.typesSelected = $scope.selectedUser.types.split(',');

		$scope.toggleSelection = function (item) {
			var index = $scope.typesSelected.indexOf(item);

			if (index > -1) {
				$scope.typesSelected.splice(index, 1);
			}
			else {
				$scope.typesSelected.push(item);
			}
		};

		$scope.checkType = function(type){
			return ($scope.types.indexOf(type) > -1);
		};

		$scope.updateUser = function () {
			//Request
			console.log("Called updateUser");
			$scope.selectedUser.types = $scope.typesSelected.join();
			$http.post('../../api/updateemployee', $scope.selectedUser) 
			.success(function(data, status) {
				console.log("updateUser ok");
			})
			.error(function(data, status) {
				console.log("Controller updateUser Error");
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);