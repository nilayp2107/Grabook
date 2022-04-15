const express = require('express');
const path = require('path');
const connection = require('./server');
const fileUpload = require("express-fileupload");

const session = require('express-session');
const res = require('express/lib/response');
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({}, connection);

const app = express();
app.use('/static',express.static('static'));

app.use(
  session({
      secret: 'cookie_secret',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
  })
);
app.use(
  fileUpload()
);
app.use(express.urlencoded({
  extended: true
}))
const hostname = '127.0.0.1';
const port = 3000;
app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));


const isAuth=(req,res,next)=>{
  if(req.session.isAuth){
    next();
  }
  else{
    res.redirect("/");
  }

}

app.get('/', function (req, res) {
    let user=req.session.user_info;
    res.status(200).render('home.pug',{user});
  });
app.listen(port,()=>{
    console.log("Listening on port 3000");
});
app.get('/signin', function (req, res) {
  // res.status(200).render('login');
  res.status(200).render('signin.pug');
});
app.post('/signin',function(req,res){

  let user_data=req.body;
  connection.query("select *from user where email_id= '"+user_data.email_id+"'and password= MD5('"+user_data.password+"');", (err, results, rows) => {
  
  if(err) throw err;

  if(results.length==0){ 
    console.log("No such records exist");
          res.status(200).redirect('/');}

else {
    req.session.isAuth = true;
    req.session.user_info=results[0];
    console.log(req.session.user_info);
    res.status(200).redirect('/');
  }
});
});
app.post('/search',function(req,res){
  let key=req.body.keyword;
  console.log(key);
  connection.query("select *from book where (title REGEXP '"+key+"' or author REGEXP '"+key+"' or publication_name REGEXP '"+key+"') and book_status='sale';", (err, results, rows) => {
    if(err) throw err;
    if(results.length==0){ 
      console.log("No such records exist");
      let books=results;
            res.status(200).render('grab_book.pug',{books});}
  else {
    // console.log(results);
    let books=results;
    res.status(200).render('grab_book.pug',{books});
  }
});
})
app.get('/grab_book',function(req,res){
  let user=req.session.user_info;
  let books;
  connection.query("select *from book where seller_user_name!=?;",[user.user_name], (err, results, rows) => {
    if(err) throw err;
    books=results;
    res.render('grab_book.pug',{user,books});
});
})
app.get('/edit_profile',isAuth,function(req,res){
    let user=req.session.user_info;
    res.render('edit_profile.pug',{user});
})
app.post('/edit_profile',isAuth,function(req,res){
  let user=req.session.user_info;
  let user_name=req.session.user_info.user_name;
  let first_name=req.body.first_name;
  let last_name=req.body.last_name;
  let occupation=req.body.occupation;
  let university_name=req.body.university_name;
  let email_id=req.body.email_id;
  let bio=req.body.bio;
  let phone_number=req.body.phone_number;
  let age=req.body.age;
  connection.query("UPDATE user SET first_name =?,last_name =?,occupation=?,university_name =?,email_id =?,bio =?,phone_number=?,age=? WHERE user_name=?;",[first_name,last_name,occupation,university_name,email_id,bio,phone_number,age,user_name],function(err,results,rows){
    if(err){
      throw err;
    }
    connection.query("select *from user where user_name= '"+user.user_name+"';", (err, results, rows) => {
  
      if(err) throw err;
    
      if(results.length==0){ 
        console.log("No such records exist");
              res.status(200).redirect('/');}
    
    else {
        req.session.user_info=results[0];
        return res.redirect('/profile');
      }
    });
    
  });
  
});
app.get('/profile',isAuth,function(req,res){
  let user=req.session.user_info;
  console.log(user);
  res.render('profile.pug',{user});
})
app.get('/wishlist',isAuth,function(req,res){
  let user=req.session.user_info;
  connection.query("SELECT * from book WHERE book_id in (SELECT book_id FROM wishlist where user_name ='"+user.user_name+"');", (err, results, rows) => {
    if(err) throw err;
    let books=results;
    res.render('wishlist.pug',{user,books});
});
})
app.post('/add_to_wishlist/:id',isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.params.id;
  console.log(book_id);
  connection.query("insert into wishlist(user_name,book_id) values (?,?);",[user.user_name,book_id], (err, results, rows) => {
    if(err) throw err;
    res.redirect('/book?id='+book_id);
});
})
app.get('/make_an_offer/:id',isAuth,function(req,res){
  let user=req.session.user_info;
  res.render("test.pug");
})
app.post('/make_an_offer/:id',isAuth,function(req,res){
  let user=req.session.user_info;
  let offer_price=req.body.offer_price;
  let offer_description=req.body.offer_description;
  let buyer_user_name=user.user_name;
  let book_id=req.params.id;
  console.log("post req");
  console.log(book_id);
  res.send("ok");
  connection.query("insert into buy(offer_price,offer_description,buyer_user_name,book_id) values ?;",[offer_price,offer_description,buyer_user_name,book_id], (err, results, rows) => {
    if(err) throw err;
    let books=results;
    res.render('wishlist.pug',{user,books});
});
})
app.get('/books_bought',isAuth,function(req,res){
  let user=req.session.user_info;
  connection.query("SELECT * from book WHERE book_id in (SELECT book_id FROM buy where buyer_user_name ='"+user.user_name+"');", (err, results, rows) => {
    if(err) throw err;
    let books=results;
    res.render('books_bought.pug',{user,books});
});
})
app.get('/books_sold',isAuth,function(req,res){
  let user=req.session.user_info;
  connection.query("SELECT * from book WHERE seller_user_name='"+user.user_name+"' and book_status='sold';", (err, results, rows) => {
    if(err) throw err;
    let books=results;
    res.render('books_sold.pug',{user,books});
});
})
app.get('/books_in_ad',isAuth,function(req,res){
  let user=req.session.user_info;
  connection.query("SELECT * from book WHERE seller_user_name='"+user.user_name+"' and book_status='sale';", (err, results, rows) => {
    if(err) throw err;
    let books=results;
    console.log(books);
    res.render('books_in_ad.pug',{user,books});
});
})
app.get('/signup', function (req, res) {
  if(req.session.user_info){
    res.redirect('/');
  }
  else{
    res.status(200).render('signup.pug');
  }
});
app.post('/signup',function(req,res){
  let user_data=req.body;
  connection.query("select * from user where user_name='"+user_data.user_name+"';",(err,rest,rows)=>{
    if(rest.length==0){
      connection.query("INSERT INTO user (user_name,first_name,last_name,email_id,phone_number,password)VALUES(?,?,?,?,?,md5(?))",[user_data.user_name,user_data.first_name,user_data.last_name,user_data.email_id,user_data.phone_number,user_data.password] ,(err, results, rows) => {
        if(err) throw err;
        else{ 
          let msg="Registered Succesfully";
          res.render('signin.pug',{msg});
      }
      });
    }
    else{
      let msg="Please Try a different username";
      res.render('signup.pug',{msg});
    }

  })
});
app.get('/logout',function(req,res){
  req.session.destroy();
  res.redirect('/');
});
app.get('/book' ,isAuth, function(req,res){
  let book_id=req.query.id;
  let user=req.session.user_info;
  connection.query("select *from book where book_id= '"+book_id+"';", (err, results, rows) => {
    if(err) throw err;

    if(results.length==0){ 
      console.log("No such records exist");
            res.status(200).redirect('/');}
  else {
    let book=results[0];
    connection.query("select *from wishlist where user_name=? and book_id=?;",[user.user_name,book_id],(err,results,rows)=>{
      if(err)throw err;
      if(results.length==0){
        let detail=0;
        console.log(book);
        res.render('book.pug',{book,user,detail});    
      }
      else{
        let detail=1;
        res.render('book.pug',{book,user,detail});
      }
    })
    
    console.log(book);
    
  }
});
});
app.get('/book_upload',isAuth,function(req,res){
  res.render('book_upload.pug');
})
app.post('/book_upload',isAuth,function(req,res){
  let user=req.session.user_info;
  let book_data=req.body;
  if(req.files){
    connection.query("SELECT AUTO_INCREMENT FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ecommerce' AND   TABLE_NAME   = 'book';", (err, results, rows) => {
      if(err) throw err;
      if(results.length==0){ 
        console.log("No such records exist");
              res.status(200).redirect('/');}
    
    else {
      let book_id=results[0].AUTO_INCREMENT;
      book_id=book_id+1;
      const images=req.files;
      const image1=req.files.myimage1;
      const image2=req.files.myimage2;
      const image3=req.files.myimage3;
      const image4=req.files.myimage4;
      let path1 = "/static/bookpics/" + book_id +"_"+1+".jpeg";
      let path2 = "/static/bookpics/" + book_id +"_"+2+".jpeg";
      let path3 = "/static/bookpics/" + book_id +"_"+3+".jpeg";
      let path4 = "/static/bookpics/" + book_id +"_"+4+".jpeg";
      let data=[req.body.title,req.body.author,req.body.description,req.body.age,req.body.genre,req.body.ISBN,req.body.price,req.body.year_of_publication,path1,path2,path3,path4,user.user_name];
      let pos=true;
      image1.mv(__dirname+path1, (err) => {
        if (err) {
          pos=false;
          return res.status(500).send(err);
        }
      });
      image2.mv(__dirname+path2, (err) => {
        if (err) {
          pos=false;
          return res.status(500).send(err);
        }
      });
      image3.mv(__dirname+path3, (err) => {
        if (err) {
          pos=false;
          return res.status(500).send(err);
        }
      });
      image4.mv(__dirname+path4, (err) => {
        if (err) {
          pos=false;
          return res.status(500).send(err);
        }
      });
      if(pos){
        connection.query("insert into book(title,author,description,age,genre,ISBN,price,year_of_publication,image_1,image_2,image_3,image_4,seller_user_name) values (?,?,?,?,?,?,?,?,?,?,?,?,?)",[book_data.title,book_data.author,book_data.description,book_data.age,book_data.genre,book_data.ISBN,book_data.price,book_data.year_of_publication,path1,path2,path3,path4,user.user_name],(err,results,rows)=>{
          if(err){
            res.send(err);
            throw err;
          }
          else{
            console.log("book added!");
            res.redirect('/books_in_ad');
          }
        });
      }
    }
  });
  }
  else{
    res.redirect('/book_upload');
  }
  
})
app.post('/profile_upload',isAuth,function(req,res){
  if(!req.files){
    res.status(200).send("No file is uploaded");
  }
  else{
    let user=req.session.user_info;
    const file=req.files.myfile;
    const path ="/static/profilepics/" +user.user_name+".jpeg";
    const path2=__dirname+path;
  file.mv(path2, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    connection.query("UPDATE user SET profile_pic = ? WHERE user_name=?;",[path,user.user_name],function(err,results,rows){
      if(err){
        throw err;
      }

    });
    req.session.user_info.profile_pic=path;
    return res.redirect('/profile');
  });

  }
});
app.post('/remove_from_wishlist/:id' ,isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.params.id;
    connection.query("delete from wishlist where book_id=? and user_name=?",[book_id,user.user_name],(err,results,rows)=>{
      if(err){
        throw err;
      }
      else{
        console.log("Deletion Successful");
        res.redirect('/book?id='+book_id);
      }

    });

});
app.get('/remove_from_ad' ,isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.query.id;
    // console.log("Authentication Successfull");
    connection.query("delete from book where book_id=? and seller_user_name=?",[book_id,user.user_name],(err,results,rows)=>{
      if(err){
        throw err;
      }
      else{
        console.log("Deletion Successful");
        res.redirect('/books_in_ad');
      }

    });

});

app.get('/ratings_reviews',function(req,res){
  let user=req.session.user_info;
  let seller_id=req.query.id;

  connection.query("select* from reviews where seller_user_name=?",[seller_id],(err,results,rows)=>{
    if(err){
      throw err;
    }
    let reviews=results;
    connection.query("select* from user where user_name=?;",[seller_id],(err,result,rows)=>{
      if(err)throw err;
      let seller=result[0];
      res.render("ratings_reviews",{reviews,user,seller});
    })
  })
  
});
app.get('/request_offer/:id',function(req,res){
  let book_id=req.params.id;
  console.log(book_id);
  res.render('request_offer',{book_id});
});
app.post('/request_offer/:id',isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.params.id;
  console.log(book_id);
  let offer_price=req.body.offer_price;
  let offer_description=req.body.offer_description;
  connection.query("insert into buy (book_id,offer_price,offer_description,buyer_user_name) values (?,?,?,?);",[book_id,offer_price,offer_description,user.user_name],(err,rows,results)=>{
    if(err){
      throw err;
    }
    else{
      // let msg="Request sent successfully";
      res.redirect("/grab_book");
    }
  })
});
app.get('/requests',isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.query.id;
  connection.query("select* from buy where book_id=? and acceptance_status='not accepted';",[book_id],(err,results,rows)=>{
    if(err)throw err;
    let requests=results;
    console.log(requests);
    connection.query("select* from book where book_id=?;",[book_id],(err,result,rows)=>{
      if(err)throw err;
      let book=result[0];
      console.log(book);
      res.render("requests.pug",{requests,book,user});
      // res.send("hello");
    })
    
  })
});
app.post('/accept_request/:id/:buyer',isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.params.id;
  let buyer=req.params.buyer;
  connection.query("update book set book_status='sold' where book_id=?",[book_id],(err,results,rows)=>{
    if(err)throw err;
  });
  connection.query("update buy set acceptance_status='accepted'  where book_id=? and buyer_user_name=?",[book_id,buyer],(err,results,rows)=>{
    if(err)throw err;
    console.log(book_id);
    res.redirect("/requests?id="+book_id);
  })
})
app.post('/reject_request/:id/:buyer',isAuth,function(req,res){
  let user=req.session.user_info;
  let book_id=req.params.id;
  let buyer=req.params.buyer;
  connection.query("delete from buy where book_id=? and buyer_user_name=?;",[book_id,buyer],(err,results,rows)=>{
    if(err)throw err;
    let requests=results;
    res.redirect("/requests?id="+book_id);
  })
})

app.post('/ratings_reviews/:id',isAuth,function(req,res){
  let user=req.session.user_info;
  let seller_id=req.params.id;
  connection.query("insert into reviews (review,ratings,seller_user_name,buyer_user_name) values (?,?,?,?);",[req.body.review,req.body.ratings,seller_id,user.user_name],(err,results,rows)=>{
    if(err)throw err;
    res.redirect("/ratings_reviews?id="+seller_id);
  })  
});
















