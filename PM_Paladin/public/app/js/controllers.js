'use strict';

var app = angular.module('xenon.controllers', []);

app.controller('MainCtrl', function($scope, $rootScope, $location, $layout, $layoutToggles, $pageLoadingBar, Fullscreen)
	{
		$rootScope.isMainPage = true;

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
		$rootScope.isMainPage 		= true;
		$rootScope.isLoggedIn 		= false;
		$rootScope.userPosition 	= [];
		$rootScope.buttonDisabled 	= false;
		$rootScope.currentPageTitle = 'Dashboard';
		$rootScope.userSSO 			= null;
		$rootScope.userName			= '';

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
					$rootScope.userName = data.name;
				}
				else{
					alert("Invalid SSO or password. \nPlease try again.");
				}
			})
			.error(function(data, status) {
				alert("Invalid SSO or password. \nPlease try again.");
			});
		};


		$scope.showLogoutButton =function () {
			return $rootScope.isLoggedIn;
		}

		$scope.logout = function () {
			$rootScope.isLoggedIn = false;
			$rootScope.userPosition = '';
			$rootScope.userSSO = null;
			$rootScope.userName = '';
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
				case 'My Tasks':
					return isTech;
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

/**
DASHBOARD
**/
app.controller('DashboardCtrl', function($scope, $rootScope, $http)
	{
		$rootScope.currentPageTitle = 'Dashboard';

		// BAR CHART INFO
		$scope.seriesBar = ['On Time', 'Past Due'];
		$scope.barColors= ['#1f9314', '#bc1a1a'];
		$scope.barOptions = {
			legend: {
				display:true,
				position: 'bottom'
			},
			title: {
				display: true,
				text: 'Statistics For Past 14 Days'
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						stepSize: 5,
						userCallback: function (label, index, labels) {
							if (Math.floor(label) === label) {
								return label;
							}
						},
					}
				}],
			},
		};

		// PIE CHART INFO
		$scope.dataPie = [];
		$scope.labelsPie = [];
		$scope.pieColors=[];
		$scope.pieOptions = {
			legend: {
				display:true,
				position: 'bottom'
			},
			title: {
				display: true,
				text: 'Tasks By Status'
			},
		};

		$http.get('../../api/gettooldates')
			.success(function (data) {
				$scope.upcomingTools = data;
			}).error(function (data, status) {
				alert('Error getting data for Dashboard tables');
			});

		$http.get('../../api/getpiechartinfo')
			.success(function (data) {
				getPieInfo(data);
  			}).error(function (data, status) {
				alert('Error getting data for Dashboard pie chart');
			});

		$http.get('../../api/getbarchartinfo')
			.success(function (data) {
				$scope.barChart = data;
				$scope.labelsBar = getBarDates();
				$scope.dataBar = getBarCounts();
  			}).error(function (data, status) {
				alert('Error getting data for Dashboard bar chart');
			});

		var getPieCounts = function(){
			var result = [];
			for(var i=0; i<$scope.pieChart.length; i++){
				result.push($scope.pieChart[i].count);
			}
			return result;
		};
		var getPieLabels = function(){
			var result = [];
			for(var i=0; i<$scope.pieChart.length; i++){
				result.push($scope.pieChart[i].status);
			}
			return result;
		};

		var getPieInfo = function(data){
			for(var i=0; i<data.length; i++) {
				$scope.dataPie.push(data[i].count);
				$scope.labelsPie.push(data[i].status);
				switch(data[i].status){
					case "On Time":
						$scope.pieColors.push('#1f9314'); // Green
						break;
					case "Past Due":
						$scope.pieColors.push('#bc1a1a'); // Red
						break;
					case "Upcoming":
						$scope.pieColors.push('#eeee00'); // Yellow #fdb45c
						break;
					case "In Progress":
						$scope.pieColors.push('#1a47d8'); // Blue
						break;
					default:
						alert("Oops! Pie chart error, contact developers!");
				}
			}
		};
		var getBarCounts = function () {
			var counts = [];
			var onTime = [];
			var pastDue = [];
			for (var i = 0; i < $scope.barChart.length; i++) {
				onTime.push($scope.barChart[i].OnTimeCount);
				pastDue.push($scope.barChart[i].PastDueCount);
			}
			counts.push(onTime);
			counts.push(pastDue);
			return counts;
		};
		var getBarDates = function () {
			var dates = [];
			var monthNames = [ "", "Jan", "Feb", "Mar",
				"Apr", "May", "Jun", "Jul",
				"Aug", "Sep", "Oct",
				"Nov", "Dec"
			];
			for (var i = 0; i < $scope.barChart.length; i++) {
				var currentDate = $scope.barChart[i].Date;
				var month = monthNames[currentDate.substring(4,6)];
				var day = currentDate.substring(6,8);
				var formattedDate = month + " " + day;
				dates.push(formattedDate);
			}
			return dates;
		};

		
	});


/**
EQUIPMENT MANAGEMENT
**/
app.controller('EquipmentMgmtCtrl', function($scope, $rootScope, $http, $modal, $timeout) 
	{

		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.getEquipmentInfo = function(){
			$http.get('../../api/lines') 
				.success(function(data, status) {
					$scope.lines = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving production line info, contact developers!");
				});

			$http.get('../../api/workstations') 
				.success(function(data, status) {
					$scope.workstations = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving workstation info, contact developers!");
				});

			$http.get('../../api/tools') 
				.success(function(data, status) {
					$scope.tools = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving tool info, contact developers!");
				});
		};

		$scope.getTools = function () {
			$http.get('../../api/tools') 
				.success(function(data, status) {
					$scope.tools = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving tool info, contact developers!");
				});
		};

		$scope.getEquipmentInfo();

		$scope.selectedLine = null;  // initialize our variable to null
		$scope.selectedWS = null;  // initialize our variable to null
		$scope.selectedTool = null;  // initialize our variable to null
		$scope.updateModal = null; // assign function to it according to what is selected
		$scope.deleteEquipment = null;
		$rootScope.onButtonDisabled = true;
		$rootScope.offButtonDisabled = true;

		$scope.createLineModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: modal_id,
				controller: 'CreateLineModalCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				scope: $scope
			});

			$scope.modalInstance.result.then(function () {
				$scope.getEquipmentInfo();

			})
		};

		$scope.createWSModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: modal_id,
				controller: 'CreateWSModalCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				scope: $scope
			});

			$scope.modalInstance.result.then(function () {
				$scope.getEquipmentInfo();

			})
		};

		$scope.createToolModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: modal_id,
				controller: 'CreateToolModalCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				scope: $scope
			});

			$scope.modalInstance.result.then(function () {
				$scope.getEquipmentInfo();

			})
		};

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

		$scope.deleteLine = function(){
			$http.post('../../api/deleteline', {'lineID': $scope.selectedLine}) 
			.success(function(data, status) {
				if(data.name === 'RequestError'){
					alert('Please reassign or unregister workstations in this line.');
				}
				else{
					alert("Line unregistered.");
				}
				$scope.getEquipmentInfo();

			})
			.error(function(data, status) {
				alert("Error unregistering line\n"+data);
			});
		};

		$scope.deleteWorkstation = function(){
			$http.post('../../api/deleteworkstation', {'workstationID': $scope.selectedWS}) 
			.success(function(data, status) {
				if(data.name === 'RequestError'){
					alert('Please reassign or unregister tools in this workstation.');
				}
				else{
					alert("Workstation unregistered.");
				}
				$scope.deleteEquipment = $scope.deleteLine;
				$scope.selectedWS = null;
				$scope.getEquipmentInfo();

			})
			.error(function(data, status) {
				alert("Error deleting workstation\n"+data);
			});
		};

		$scope.deleteTool = function(){
			$http.post('../../api/deletetool', {'toolID': $scope.selectedTool}) 
			.success(function(data, status) {
				alert("Tool unregistered.");
				$rootScope.onButtonDisabled = true;
				$rootScope.offButtonDisabled = true;
				$scope.deleteEquipment = $scope.deleteWorkstation;
				$scope.selectedTool = null;
				$scope.getEquipmentInfo();
			})
			.error(function(data, status) {
				alert("Error deleting tool\n"+data);
			});
		};

		$scope.turnToolOn = function () {
			$http.post('../../api/settoolactive', {'toolID': $scope.selectedTool}) 
			.success(function(data, status) {
				alert("Tool activated.");
			})
			.error(function(data, status) {
				alert("Error turning on tool\n"+data);
			});
		};

		$scope.turnToolOff = function () {
			$http.post('../../api/settoolinactive', {'toolID': $scope.selectedTool}) 
			.success(function(data, status) {
				alert("Tool disactivated.");
			})
			.error(function(data, status) {
				alert("Error turning off tool\n"+data);
			});
		};

		$scope.setClickedLine = function(index){  //function that sets the value of selectedRow to current index
			$scope.selectedLine = index;
			$scope.selectedWS = null;  //para evitar que se guarde la seleccion de ws
			$scope.selectedTool = null;
			$scope.updateModal = $scope.updateLineModal;
			$scope.deleteEquipment = $scope.deleteLine;
			$rootScope.onButtonDisabled = true;
			$rootScope.offButtonDisabled = true;
		};
		
		$scope.setClickedWS = function(index){  //function that sets the value of selectedRow to current index
			$scope.selectedWS = index;
			$scope.selectedTool = null;
			$scope.updateModal = $scope.updateWorkstationModal;
			$scope.deleteEquipment = $scope.deleteWorkstation;
			$rootScope.onButtonDisabled = true;
			$rootScope.offButtonDisabled = true;
		};

		$scope.setClickedTool = function(index, isActive){  //function that sets the value of selectedRow to current index
			$scope.selectedTool = index;
			$scope.updateModal = $scope.updateToolModal;
			$scope.deleteEquipment = $scope.deleteTool;
			$rootScope.onButtonDisabled = isActive;
			$rootScope.offButtonDisabled = !isActive;
		};

		$rootScope.disableOffButtonDelay = function(){
			$rootScope.offButtonDisabled=true;
			$scope.turnToolOff();
			$timeout(function(){
				$rootScope.onButtonDisabled=false;
			},5000);
		};

		$rootScope.disableOnButtonDelay = function(){
			$rootScope.onButtonDisabled=true;
			$scope.turnToolOn();
			$timeout(function(){
				$rootScope.offButtonDisabled=false;
			},5000);
		};


	});

app.controller('CreateLineModalCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', function($scope, $rootScope, $http, $modalInstance)
	{
		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.users = {}; // Just a declaration
		$scope.userInCharge = {};
		$scope.lineNames = [];
		$scope.remoteIoAddresses = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];


		$scope.lineInfo = {
			'lineName': '',
			'remoteIoAddress': '',
			'supervisorFirstName': '',
			'supervisorLastName': '',
			'supervisorEmail': ''
		};

		$scope.getEquipmentInfo = function(){
			$http.get('../../api/lines') 
				.success(function(data, status) {
					$scope.lines = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving production line info, contact developers!");
				});

			$http.get('../../api/workstations') 
				.success(function(data, status) {
					$scope.workstations = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving workstation info, contact developers!");
				});

			$http.get('../../api/tools') 
				.success(function(data, status) {
					$scope.tools = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving tool info, contact developers!");
				});
		};

		$http.get('../../api/employees')
			.success(function (data) {
				$scope.users = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving employees info!');
			});

		$http.get('../../api/pmprolines')
			.success(function (data) {
				$scope.lineNames = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving production line info from PM Pro!');
			});

		$scope.createLine = function () {
			//Request
			$http.post('../../api/createline', $scope.lineInfo) 
			.success(function(data, status) {
				$scope.getEquipmentInfo();
			})
			.error(function(data, status) {
				alert('Oops! Error registering line, contact developers!');
			});
		};
		
		$scope.closeLine = function(){
			$scope.createLine();
			$scope.getEquipmentInfo();
			$modalInstance.close();
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

app.controller('CreateWSModalCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', function($scope, $rootScope, $http, $modalInstance)
	{
		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.remoteIoAddresses = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
		$scope.moduleNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
		$scope.pointNumbers = [0,1,2,3,4,5,6,7];
		$scope.rfidAddresses = [];
		$scope.users = {}; // Just a declaration
		$scope.userInCharge = {};
		$scope.lineNames = [];
		$scope.pmProTools = [];
		$scope.selectedTool = {};

		$scope.workstationInfo = {
			'workstationName': '',
			'greenLightModuleNumber': '',
			'greenLightPointNumber': '',
			'yellowLightModuleNumber': '',
			'yellowLightPointNumber': '',
			'redLightModuleNumber': '',
			'redLightPointNumber': '',
			'employeeSso': ''
		};

		$scope.getEquipmentInfo = function(){
			$http.get('../../api/lines') 
				.success(function(data, status) {
					$scope.lines = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving production line info, contact developers!");
				});

			$http.get('../../api/workstations') 
				.success(function(data, status) {
					$scope.workstations = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving workstation info, contact developers!");
				});

			$http.get('../../api/tools') 
				.success(function(data, status) {
					$scope.tools = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving tool info, contact developers!");
				});
		};

		$http.get('../../api/employees')
			.success(function (data) {
				$scope.users = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving employees info!');
			});

		$http.get('../../api/pmproworkstations')
			.success(function (data) {
				$scope.wsNames = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving workstation info from PM Pro!');
			});

		$scope.createWorkstation = function () {
			$http.post('../../api/createworkstation', $scope.workstationInfo) 
			.success(function(data, status) {
				$scope.getEquipmentInfo();
			})
			.error(function(data, status) {
				alert('Oops! Error registering workstation, contact developers!');
			});
		};
		
		$scope.closeWS = function(){
			$scope.createWorkstation();
			$scope.getEquipmentInfo();
			$modalInstance.close();
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

app.controller('CreateToolModalCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', function($scope, $rootScope, $http, $modalInstance)
	{
		$rootScope.currentPageTitle = 'Equipment Management';

		$scope.remoteIoAddresses = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
		$scope.moduleNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
		$scope.pointNumbers = [0,1,2,3,4,5,6,7];
		$scope.rfidAddresses = [];
		$scope.users = {}; // Just a declaration
		$scope.userInCharge = {};
		$scope.lineNames = [];
		$scope.pmProTools = [];
		$scope.selectedTool = {};

		$scope.toolInfo = {
			'toolType': '',
			'rfidAddress': '',
			'remoteIoModuleNumber': '',
			'remoteIoPointNumber': '',
			'employeeSso': '',
			'toolName': '',
			'pmProToolID': '',
			'workstationName': '',
			'lineName': '',
			'supplier': '',
			'yearBought': '',
			'originalCostDollars':''
		};

		$scope.getEquipmentInfo = function(){
			$http.get('../../api/lines') 
				.success(function(data, status) {
					$scope.lines = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving production line info, contact developers!");
				});

			$http.get('../../api/workstations') 
				.success(function(data, status) {
					$scope.workstations = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving workstation info, contact developers!");
				});

			$http.get('../../api/tools') 
				.success(function(data, status) {
					$scope.tools = data;
				})
				.error(function(data, status) {
					console.log("Oops! Error retrieving tool info, contact developers!");
				});
		};

		$http.get('../../api/employees')
			.success(function (data) {
				$scope.users = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving employees info!');
			});

		$http.get('../../api/pmprotools')
			.success(function (data) {
				$scope.pmProTools = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving tool info from PM Pro!');
			});

		$scope.createTool = function () {
			//Request
			$scope.toolInfo.toolName = $scope.selectedTool.toolName;
			$scope.toolInfo.pmProToolID = $scope.selectedTool.pmProToolID;
			$scope.toolInfo.workstationName = $scope.selectedTool.workstationName;
			$scope.toolInfo.lineName = $scope.selectedTool.lineName;
			$scope.toolInfo.supplier = $scope.selectedTool.supplier;
			$scope.toolInfo.yearBought = $scope.selectedTool.yearBought;
			$scope.toolInfo.originalCostDollars = $scope.selectedTool.originalCostDollars;
			$http.post('../../api/createtool', $scope.toolInfo) 
			.success(function(data, status) {
				$scope.getEquipmentInfo();
			})
			.error(function(data, status) {
				alert('Oops! Error registering tool, contact developers!');
			});
		};

		$scope.getScannedTags = function () {
			//Request
			$http.get('../../api/getscannedrfidtags') 
			.success(function(data, status) {
				$scope.rfidAddresses = data;
			})
			.error(function(data, status) {
				alert('Oops! Error retrieving scanned RFID tags, contact developers!');
			});
		};
		
		$scope.closeTool = function(){
			$scope.createTool();
			$scope.getEquipmentInfo();
			$modalInstance.close();
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

app.controller('LineUpdateCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', 'selectedLine', function($scope, $rootScope, $http, $modalInstance, selectedLine)
	{
		
		$rootScope.currentPageTitle = 'Equipment Management';
		
		$scope.lineInfo = selectedLine;

		$scope.updateLine = function () {
			$http.post('../../api/updateline', $scope.lineInfo) 
			.success(function(data, status) {

			})
			.error(function(data, status) {
				alert('Oops! Error updating production line, contact developers!');
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};
	}]);

app.controller('WSUpdateCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', 'selectedWS', function($scope, $rootScope, $http, $modalInstance, selectedWS)
	{
		$rootScope.currentPageTitle = 'Equipment Management';
		$scope.moduleNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
		$scope.pointNumbers = [0,1,2,3,4,5,6,7];

		$scope.workstationInfo = selectedWS;
		$scope.users = {};
		$http.get('../../api/employees')
		.success(function (data) {
			$scope.users = data;
		}).error(function (data, status) {
			alert('Oops! Error retrieving users, contact developers!');
		});

		$scope.updateWorkstation = function () {
			$http.post('../../api/updateworkstation', $scope.workstationInfo) 
			.success(function(data, status) {

			})
			.error(function(data, status) {
				alert('Oops! Error updating workstation, contact developers!');
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

app.controller('ToolUpdateCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', 'selectedTool', function($scope, $rootScope, $http, $modalInstance, selectedTool)
	{
		$rootScope.currentPageTitle = 'Equipment Management';
		$scope.moduleNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
		$scope.pointNumbers = [0,1,2,3,4,5,6,7];
		$scope.rfidAddresses = [0,1,2,3,4,5,6,7,8,9];
		$scope.toolInfo = selectedTool;
		$scope.users = {};
		$http.get('../../api/employees')
			.success(function (data) {
				$scope.users = data;
			}).error(function (data, status) {
				alert();
			});

		$scope.updateTool = function () {
			$http.post('../../api/updatetool', $scope.toolInfo) 
			.success(function(data, status) {
			
			})
			.error(function(data, status) {
				alert('Oops! Error registering tool, contact developers!');
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);

/**
USER MANAGEMENT
**/
app.controller('UserMgmtCtrl', function($scope, $rootScope, $http, $modal) 
	{	
		$rootScope.currentPageTitle = 'User Management';

		$scope.selectedUser = {}; // User (obtained from DB) to pass to Update User modal


		$scope.getEmployees = function(){
			$http.get('../../api/employees')
			.success(function (data) {
				$scope.users = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving employees, contact developers!');
			});	
		};

		$scope.getEmployees();

		$scope.checkSelectedUser = function (sso) {
			for(var i=0; i<$scope.users.length; i++){
				if($scope.users[i].sso == sso){
					$scope.selectedUser = $scope.users[i];
				}
			}
		};

		$scope.deleteEmployee = function () {
			if ($rootScope.userSSO == $scope.selectedUser.sso){
				alert("Cannot delete currently logged in user!")
			} else {
				//Request
				$http.post('../../api/deleteemployee', {'sso': $scope.selectedUser.sso}) 
				.success(function(data, status) {
					alert("User deleted.");
					$scope.getEmployees();
				})
				.error(function(data, status) {
					alert('Oops! Error deleting user, contact developers!');
				});
			}
		};

		$scope.updateUserModal = function(modal_id, modal_size, modal_backdrop){
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

		$scope.createUserModal = function(modal_id, modal_size, modal_backdrop){
			$scope.modalInstance = $modal.open({
				templateUrl: modal_id,
				controller: 'CreateUserModalCtrl',
				size: modal_size,
				backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
				scope: $scope
			});

			$scope.modalInstance.result.then(function () {
				$scope.getEmployees();
			})
		};
		
	});

app.controller('CreateUserModalCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', function($scope, $rootScope, $http, $modalInstance)
	{
		$rootScope.currentPageTitle = 'User Management';

		$scope.employeeTypes = ['Administrator', 'Engineer', 'Technician'];
		$scope.selection = []; // Binded to selected user roles in create user modal
		$scope.userInfo = {
			'sso': '',
			'firstName': '',
			'lastName': '',
			'email': '',
			'password': '',
			'employeeType': $scope.selection,
			'supervisorFirstName': '',
			'supervisorLastName': '',
			'supervisorEmail': ''
		}; // Binded to Create User Modal fields
		
		$scope.users = {}; // Just a declaration
		$scope.confirmPassword = '';

		// Handles user types
		$scope.toggleSelection = function (item) {
			var index = $scope.selection.indexOf(item);

			if (index > -1) {
				$scope.selection.splice(index, 1);
			}
			else {
				$scope.selection.push(item);
			}
		};

		$scope.createEmployee = function () {
			$http.post('../../api/createemployee', $scope.userInfo) 
			.success(function(data, status) {
				alert("User created.");
			})
			.error(function(data, status) {
				alert('Oops! Error creating user, contact developers!');
			});
		};

		$scope.sendEmail = function () {
			$http.post('../../api/emailnewuser', $scope.userInfo) 
			.success(function(data, status) {
			})
			.error(function(data, status) {
				alert('Oops! Error sending new user email, contact developers!');
			});
		};

		$scope.isTechnician = function(){return $scope.selection.indexOf('Technician') > -1;};

		$scope.closeUser = function(){
			$scope.createEmployee();
			$scope.sendEmail();
			$modalInstance.close();
		};

		$scope.close = function(){
			$modalInstance.close();
		};

	}]);




app.controller('UpdateUserModalCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', 'selectedUser', function($scope, $rootScope, $http, $modalInstance, selectedUser)
	{
		$rootScope.currentPageTitle = 'User Management';

		$scope.userToUpdate = selectedUser;
		$scope.placeholderUser = selectedUser;
		$scope.employeeTypes = ['Administrator', 'Engineer', 'Technician'];
		$scope.typesSelected = $scope.userToUpdate.types.split(',');

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
			$scope.userToUpdate.types = $scope.typesSelected.join();
			$http.post('../../api/updateemployee', $scope.userToUpdate) 
			.success(function(data, status) {
				
			})
			.error(function(data, status) {
				alert('Oops! Error updating user, contact developers!');
			});
		};

		$scope.close = function(){
			$modalInstance.close();
		};

		$scope.isTechnician = function(){return $scope.typesSelected.indexOf('Technician') > -1;};

	}]);

/**
MY TASKS
**/
app.controller('MyTasksCtrl', function($scope, $rootScope, $http) 
	{
		$rootScope.currentPageTitle = 'My Tasks';

		$http.post('../../api/gettasks', {'sso': $rootScope.userSSO})
		.success(function (data) {
			$scope.tasks = data;
		}).error(function (data, status) {
			alert('Oops! Error retrieving your tasks, try again later or contact developers!');
		});

	});

/**
MAINTENANCE CONFIRMATION
**/
app.controller('MaintConfCtrl', function($scope, $rootScope, $http) 
	{
		$rootScope.currentPageTitle = 'Maintenance Confirmation';

		$scope.getConfirmTasks = function () {
			$http.post('../../api/confirmtasks', {'sso': $rootScope.userSSO})
			.success(function (data) {
				$scope.tasks = data;
				$scope.uncheckBoxes();
			}).error(function (data, status) {
				alert('Error performing query to get tasks to confirm, contact developers!');
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
			});
			$scope.selection = [];
		};

		$scope.sendEmail = function (type) {
			if (type === 'partial') {
				$http.post('../../api/emailpartial', {'tecName': $rootScope.userName, 'tasks': $scope.selection}) // Technician name + selected tasks
				.success(function(data, status) {
					alert(`Emails have been sent to ${data.emails}`);
				})
				.error(function(data, status) {
					alert(`Oops! Error sending partial confirmation notification emails, please contact developers!\nError status: ${status}`);
				});
			} else {
				$http.post('../../api/emailfull', {'tecName': $rootScope.userName, 'tasks': $scope.selection}) 
				.success(function(data, status) {
					alert(`Emails have been sent to ${data.emails}`);
				})
				.error(function(data, status) {
					alert("Oops! Error sending full confirmation notification emails, please contact developers!");
				});
			}
			$scope.uncheckBoxes();
		};

		$scope.confirmFull = function(){
			var newSelection = [];
			for (var i = 0; i< $scope.selection.length; i++) {newSelection.push($scope.selection[i].Task);}

			$http.post('../../api/confirmfull', {'tasks': newSelection})
			.success(function (data) {
				//$scope.sendEmail('full');
				$scope.uncheckBoxes();
				$scope.getConfirmTasks();
			}).error(function (data, status) {
				alert('Oops! Error performing Full Confirmation query, please contact developers!');
			});
		};
		

		$scope.confirmPartial = function(){
			var newSelection = [];
			for (var i = 0; i< $scope.selection.length; i++) {newSelection.push($scope.selection[i].Task);}

			$http.post('../../api/confirmpartial', {'tasks': newSelection}) // Selected task IDs
			.success(function (data) {
				//$scope.sendEmail('partial');
				$scope.uncheckBoxes();
				$scope.getConfirmTasks();
			})
			.error(function (data, status) {
				alert('Oops! Error performing Partial Confirmation query, please contact developers!');
			});
		};
	});

/**
MAINTENANCE APPROVAL
**/
app.controller('MaintApprCtrl', function($scope, $rootScope, $http) 
	{
		$rootScope.currentPageTitle = 'Maintenance Approval';

		$scope.selection = [];

		$scope.getApproveTasks = function () {
			$http.post('../../api/approvetasks', {'sso': $rootScope.userSSO})
			.success(function (data) {
				$scope.tasks = data;
			}).error(function (data, status) {
				alert('Oops! Error retrieving your tasks to approve, try again later or contact developers!');
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
			});
			$scope.selection = [];
		};

		$scope.sendEmail = function () {
			$http.post('../../api/emailapprove', {'engName': $rootScope.userName, 'tasks': $scope.selection}) // Engineer name + selected tasks
			.success(function(data, status) {
				alert(`Emails have been sent to ${data.emails}`);
				$scope.uncheckBoxes();
			})
			.error(function(data, status) {
				alert(`Oops! Error sending approval notification emails, please contact developers!\nError status: ${status}`);
			});
		};

		$scope.approveTasks = function(){
			var newSelection = [];
			for (var i = 0; i< $scope.selection.length; i++) {newSelection.push($scope.selection[i].Task);}

			$http.post('../../api/approve', {'tasks': newSelection}) // Selected task IDs
			.success(function (data) {
				//$scope.sendEmail();
				$scope.uncheckBoxes();
				$scope.getApproveTasks();
			})
			.error(function (data, status) {
				alert('Oops! Error performing Task Approval query, please contact developers!');
			});
		};

		
	});
