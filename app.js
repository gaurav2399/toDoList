const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));

const mongo_url_cloud = "mongodb+srv://admin-gaurav:gaurav%40sharma@cluster0.udwj8.mongodb.net/toDoListDb?retryWrites=true&w=majority";
const mongo_url_local = "mongodb://localhost:27017/toDoListDB";

mongoose.connect(mongo_url_local);

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

app.get('/favicon.ico', (req, res) => {
  res.status(204);
  res.send();
});

app.get('/', function(req, res) {
  List.find({}, function(err, lists) {
    if (!err) {
      if (lists && lists.length > 0) {
        res.render('home', {
          haveList: true
        });
      } else {
        res.render('home', {
          haveList: false
        });
      }

    } else {
      res.send(err);
    }
  });
});

app.get('/lists/:listName', function(req, res) {
  const customListName = _.capitalize(req.params.listName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (err) {
      console.log("error " + err);
      res.send(err);
    } else {
      if (foundList) {
        res.render('list', {
          listTitle: foundList.name,
          listItems: foundList.items
        });
      } else {
        res.send('list is not saved');
      }
    }
  });

});

app.get('/about', function(req, res) {
  res.render('about', {});
});

app.post('/lists/:listName', function(req, res){
  const listName = req.params.listName;
  res.redirect('/lists/' + listName);
});

app.get('/showList', function(req, res){
  List.find({}, function(err, lists) {
    if (!err && lists.length > 0) {
      res.render('list', {
        listTitle: "Lists",
        listItems: lists
      });
    } else {
      res.send(err);
    }
  });
});

app.post('/showList', function(req, res) {
    res.redirect('/showList');
});

app.post('/addList', function(req, res) {
  if (req.body.from === 'home') {
    res.render('list', {
      listTitle: "Add List",
      listItems: []
    });
  } else if(req.body.from === 'Add List'){
    const listName = req.body.newListName;

    List.findOne({
      name: listName
    }, function(err, foundList) {
      if (!err) {
        if (foundList) {
          console.log("List with this name already exists!");
        } else {
          foundList = new List({
            name: _.capitalize(listName),
            items: defaultItems
          });
          foundList.save(function(err) {
            if (!err) {
              res.redirect('/');
            } else {
              console.log("while saving error comes " + err);
            }
          });
        }
      } else {
        console.log("finding list error " + err);
      }
    });
  }

});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save(function(err) {
      if (!err) {
        res.redirect('/');
      }
    });
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save(function(err) {
          if (!err) {
            res.redirect('/lists/' + listName);
          }else{
            console.log('while saving item to list error ' + err);
          }
        });
      } else {
        console.log(err);
      }
    })
  }

});

app.post('/delete', function(req, res) {
  const item = req.body.checkbox;
  const listName = req.body.list;
  if (listName === "Today") {
    Item.findByIdAndRemove(req.body.checkbox, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully item removed from list " + listName + " !!");
        res.redirect('/');
      }
    });
  } else if(listName === 'Lists'){
    // delete list by using it id.
    List.findByIdAndRemove(req.body.checkbox, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully list removed!!");
        res.redirect('/showList');
      }
    })
  }else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: item
        }
      }
    }, function(err) {
      if (!err) {
        res.redirect('/lists/' + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log('server started listening on port 3000...');
})
