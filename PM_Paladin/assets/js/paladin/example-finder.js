var container = document.getElementById('container2');
var data = [{
  label: 'Item 1',
  children: [{
    label: 'Item 1A',
    children: [{
      label: 'Item 1A1'
    }]
  }, {
    label: 'Item 1B'
  }]
}];
var options = {};

var f = finder(container, data, options);

f.on('leaf-selected', function(item) {
  console.log('Leaf selected', item);
});