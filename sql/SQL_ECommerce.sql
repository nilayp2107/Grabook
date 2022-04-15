create database ecommerce;
use ecommerce;
create table user(
user_name varchar(50) primary key,
first_name varchar(50) not null,
last_name varchar(50),
email_id varchar(50),
phone_number bigint not null,
password varchar(50) not null,
age int,
bio varchar(200),
profile_pic blob,
university_name varchar(100),
occupation varchar(50));

create table book(
book_id int primary key auto_increment,
title varchar(100) not null,
ISBN varchar(30),
author varchar(50),
genre varchar(30),
year_of_publication int,
publication_name varchar(50),
price int,
image_1 blob,
image_2 blob,
image_3 blob,
image_4 blob,
age_of_book int,
date_of_post date,
place varchar(50),
book_status varchar(30) default 'sale',
seller_user_name varchar(50) not null,
foreign key(seller_user_name) references user(user_name));

create table reviews(
review varchar(500),
ratings int,
seller_user_name varchar(50),
buyer_user_name varchar(50),
foreign key(seller_user_name) references user(user_name),
foreign key(buyer_user_name) references user(user_name),
primary key (seller_user_name, buyer_user_name));

create table wishlist(
user_name varchar(50),
book_id int,
foreign key(user_name) references user(user_name),
foreign key(book_id) references book(book_id),
primary key(user_name, book_id)
);

create table buy(
offer_price int,
offer_description varchar(200),
acceptance_status varchar(50) default 'not accepted',
buyer_user_name varchar(50),
book_id int,
foreign key(buyer_user_name) references user(user_name),
foreign key(book_id) references book(book_id),
primary key (buyer_user_name, book_id)
);
 




