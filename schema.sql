

create table auction (
    id int not null auto_increment,
    title text not null,
    image text not null,
    description text not null,
    category text not null,
    end_date datetime not null,
    primary key(id)
);

create table bid (
    id int not null auto_increment,
    auction_id int not null,
    bidder_name text not null,
    bid_amount decimal(10, 2) not null,
    comment text,
    primary key(id),
    foreign key(auction_id) references auction(id)
);