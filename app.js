const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));

mongoose.connect("mongodb+srv://admin-gaurav:gaurav%40sharma@cluster0.udwj8.mongodb.net/toDoListDb?retryWrites=true&w=majority");

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const eatFood = new Item({
  name: "Welcome to my TODO List!!"
});

const buyFood = new Item({
  name: "Press + icon to add new item."
});

const checkFood = new Item({
  name: "<- click this to remove item."
});

const defaultItems = [eatFood, buyFood, checkFood];

app.get('/', function(req, res) {

  Item.find({}, function(err, items) {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, function(err, items) {
          if (err) {
            console.log(err);
          }else{
            res.redirect('/');
          }
        });

      } else {
        res.render('list', {
          listTitle: "Today",
          listItems: items
        });
      }
    }
  });

});

app.get('/favicon.ico', (req, res) => res.status(204));

app.get('/:customList', function(req, res) {
  const customListName = _.capitalize(req.params.customList);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (err) {
      console.log("error " + err);
    } else {
      if (foundList) {
        res.render('list', {
          listTitle: foundList.name,
          listItems: foundList.items
        });
      }else{
        foundList = new List({
          name: customListName,
          items: defaultItems
        });
        foundList.save(function(err){
          if(!err){
            res.redirect('/' + customListName);
          }
        });
      }
    }
  });

});

app.get('/about', function(req, res) {
  res.render('about', {});
})

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save(function(err){
      if(!err){
        res.redirect('/');
      }
    });
  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save(function(err){
          if(!err){
            res.redirect('/' + listName);
          }
        });
      }else{
        console.log(err);
      }
    })
  }

});

app.post('/delete', function(req, res) {
  const item = req.body.checkbox;
  const listName = req.body.list;
  if(listName === "Today"){
    Item.findByIdAndRemove(req.body.checkbox, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed!!");
        res.redirect('/');
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: item}}},function(err){
      if(!err){
        res.redirect('/' + listName);
      }
    });
  }
});

app.listen(3000, function() {
  console.log('server started listening on port 3000...');
})
