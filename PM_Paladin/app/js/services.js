'use strict';

angular.module('xenon.services', []).
	service('$menuItems', function()
	{
		this.menuItems = [];

		var $menuItemsRef = this;

		var menuItemObj = {
			parent: null,

			title: '',
			link: '', // starting with "./" will refer to parent link concatenation
			state: '', // will be generated from link automatically where "/" (forward slashes) are replaced with "."
			icon: '',

			isActive: false,
			label: null,

			menuItems: [],

			setLabel: function(label, color, hideWhenCollapsed)
			{
				if(typeof hideWhenCollapsed == 'undefined')
					hideWhenCollapsed = true;

				this.label = {
					text: label,
					classname: color,
					collapsedHide: hideWhenCollapsed
				};

				return this;
			},

			addItem: function(title, link, icon)
			{
				var parent = this,
					item = angular.extend(angular.copy(menuItemObj), {
						parent: parent,

						title: title,
						link: link,
						icon: icon
					});

				if(item.link)
				{
					if(item.link.match(/^\./))
						item.link = parent.link + item.link.substring(1, link.length);

					if(item.link.match(/^-/))
						item.link = parent.link + '-' + item.link.substring(2, link.length);

					item.state = $menuItemsRef.toStatePath(item.link);
				}

				this.menuItems.push(item);

				return item;
			}
		};

		this.addItem = function(title, link, icon)
		{
			var item = angular.extend(angular.copy(menuItemObj), {
				title: title,
				link: link,
				state: this.toStatePath(link),
				icon: icon
			});

			this.menuItems.push(item);

			return item;
		};

		this.getAll = function()
		{
			return this.menuItems;
		};

		this.prepareSidebarMenu = function()
		{
			var dashboard   			 = this.addItem('Dashboard', 				'/app/dashboard', 			'linecons-desktop');
			var equipment_management     = this.addItem('Equipment Management',		'/app/equipment_management','linecons-cog');
			var user_management  		 = this.addItem('User Management', 			'/app/user_management', 	'linecons-user');
			var maintenance_confirmation = this.addItem('Maintenance Confirmation', '/app/maintenance_confirmation', 'linecons-thumbs-up');
			var maintenance_approval  	 = this.addItem('Maintenance Approval',		'/app/maintenance_approval', 	'linecons-eye').setLabel('5', 'secondary', false);

			return this;
		};

		this.instantiate = function()
		{
			return angular.copy( this );
		}

		this.toStatePath = function(path)
		{
			return path.replace(/\//g, '.').replace(/^\./, '');
		};

		this.setActive = function(path)
		{
			this.iterateCheck(this.menuItems, this.toStatePath(path));
		};

		this.setActiveParent = function(item)
		{
			item.isActive = true;
			item.isOpen = true;

			if(item.parent)
				this.setActiveParent(item.parent);
		};

		this.iterateCheck = function(menuItems, currentState)
		{
			angular.forEach(menuItems, function(item)
			{
				if(item.state == currentState)
				{
					item.isActive = true;

					if(item.parent != null)
						$menuItemsRef.setActiveParent(item.parent);
				}
				else
				{
					item.isActive = false;
					item.isOpen = false;

					if(item.menuItems.length)
					{
						$menuItemsRef.iterateCheck(item.menuItems, currentState);
					}
				}
			});
		}
	});