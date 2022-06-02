const express = require('express');
const router = express.Router();
const getDb = require('../../database/database').getDb;
const { ObjectId } = require('mongodb');
const https = require('https');
const shortid = require('shortid')
const Razorpay = require('razorpay')

const razorpay = new Razorpay({
    key_id: 'rzp_live_5yf5nto2wEON7a',
    key_secret: 'AQI6C7Zn4VAU24JrqaNRjFpx'
})

router.use('/orderIssue', async (req, res, next) => {
    let db = getDb();
    console.log(req.body);
    console.log("adad")
    const { userid, address, amount } = req.headers;
    console.log(userid);
    const payment_capture = 1
    const amount2 = amount
    const currency = 'INR'
    const options = 
    {
        amount: amount2 * 100,
        currency,
        receipt: shortid.generate(),
        payment_capture
    }
    const newDate = new Date().toLocaleDateString();

    let response2;
    db.collection('users').findOne({ _id: new ObjectId(userid) }).then(async (user) => {
        db.collection('orders').insertOne({ userid: user._id, name: user.name, email: user.email, number: user.number, cart: user.cart, address: address, status: '', amount: amount, date: newDate }).then(async (response) => {
            try {
                response2 = await razorpay.orders.create(options)
                res.json({
                    id: response2.id,
                    currency: response2.currency,
                    amount: response2.amount
                })
            } catch (error) {
                console.log(error)
            }

            // db.collection('users').updateOne({ _id: new ObjectId(user._id) }, {
            //     $set: {
            //         cart: []
            //     }
            // }).then(async (response) => {
            //     res.send(response)
            // })
        })
    })
})

router.use('/orderCash', (req, res, next)=>{
    const newDate = new Date().toLocaleDateString();
    let db = getDb();
    console.log(req.body);
    console.log("adad")
    const { userid, address, amount } = req.headers;
    db.collection('users').findOne({ _id: new ObjectId(userid) }).then(async (user) => {
        db.collection('orders').insertOne({ userid: user._id, name: user.name, email: user.email, number: user.number, cart: user.cart, address: address, status: '', amount: amount, date: newDate, paymentid: "cashondelivery" }).then((response) => {
            db.collection('users').updateOne({ _id: new ObjectId(user._id) }, {
                $set: {
                    cart: []
                }
            }).then(async (response) => {
                res.send(response)
            })
        })
    })  
})

router.use('/orderPaymentDone', (req, res, next) => {
    const { order, payment, signature } = req.headers
    const newDate = new Date().toLocaleDateString();
    let db = getDb();
    console.log(req.body);
    console.log("adad")
    const { userid, address, amount } = req.headers;
    db.collection('users').findOne({ _id: new ObjectId(userid) }).then(async (user) => {
        db.collection('orders').insertOne({ userid: user._id, name: user.name, email: user.email, number: user.number, cart: user.cart, address: address, status: '', amount: amount, date: newDate, transactionid: order, paymentid: payment, signature: signature }).then((response) => {
            db.collection('users').updateOne({ _id: new ObjectId(user._id) }, {
                $set: {
                    cart: []
                }
            }).then(async (response) => {
                res.send(response)
            })
        })
    })
})

router.use('/razorpay', (req, res, next) => {

})

router.use('/invoice', (req, res, next) => {
    let db = getDb();
    const { orderid } = req.headers;
    console.log(orderid)
    db.collection('orders').findOne({ _id: new ObjectId(orderid) }).then((response) => {
        console.log(response)
        res.send(response)
    })
})

router.use('/orderUser', (req, res, next) => {
    let db = getDb();
    console.log("ORder")
    let { id } = req.headers;
    console.log(id)
    db.collection('orders').find({ userid: new ObjectId(id) }).toArray().then((response) => {
        res.send(response)
    })
})

router.use('/orderReceived', (req, res, next) => {
    console.log('order received')
    let db = getDb();
    db.collection('orders').find({ status: '' }).sort({ _id: -1 }).toArray().then((response) => {
        res.send(response)
    })
})

router.use('/orderReceivedAccepted', (req, res, next) => {
    console.log('order received accepted')
    let db = getDb();
    db.collection('orders').find({ status: 'Accepted', transit: undefined }).sort({ _id: -1 }).toArray().then((response) => {
        res.send(response)
    })
})

router.use('/orderInTransit', (req, res, next) => {
    console.log('order In Transit')
    let db = getDb();
    db.collection('orders').find({ status: 'Accepted', transit: 'intransit' }).sort({ _id: -1 }).toArray().then((response) => {
        res.send(response)
    })
})

router.use('/orderReject', (req, res, next) => {
    let { _id } = req.body;
    let db = getDb();
    db.collection('orders').updateOne({ _id: new ObjectId(_id) }, {
        $set: {
            status: 'reject'
        }
    }).then((response) => {
        res.send({ status: 'ok' })
    })
})


router.use('/orderDeliverySet', (req, res, next) => {
    let db = getDb();
    console.log("ORdRe Delivery")
    console.log(req.body)
    db.collection('orders').updateOne({ _id: new ObjectId(req.body._id) }, {
        $set: {
            transit: 'intransit',
            service: req.headers.service,
            coid: req.headers.id
        }
    }).then((response) => {
        res.send({ status: 'ok' })
    })
})
router.use('/orderDelivered', (req, res, next) => {
    let db = getDb();
    console.log("ORdRe Delivery")
    console.log(req.body)
    const currentDate = new Date()
    const dateArray = currentDate.toLocaleDateString()
    db.collection('orders').updateOne({ _id: new ObjectId(req.body._id) }, {
        $set: {
            transit: 'delivered',
            deliveryDate: dateArray
        }
    }).then((response) => {
        res.send({ status: 'ok' })
    })
})

router.use('/DeliverHistory', (req, res, next) => {
    console.log('Delivery History')
    let db = getDb();
    db.collection('orders').find({ transit: 'delivered' }).sort({ _id: -1 }).toArray().then((response) => {
        res.send(response)
    })
})

router.use('/orderAccept', async (req, res, next) => {
    let anotherCart = req.body;
    console.log("Req B")

    let { _id } = req.body;
    console.log(_id)
    let { length, width, weight, height } = req.headers
    console.log(req.headers)
    let db = getDb();
    db.collection('orders').find({ _id: new ObjectId(_id) }).toArray().then((response) => {
        let responsePar = response[0];
        console.log("Ado")
        console.log(responsePar)
        console.log(response)
        let { cart, _id } = req.body;
        console.log(cart)
        let flag = 0;
        for (let i = 0; i < cart.length; i++) {
            (function (i) {
                db.collection('seeds').findOne({ _id: new ObjectId(cart[i].product) }).then((response) => {
                    let quant = parseInt(response.quantity);
                    if (quant > cart[i].quantity) {
                        let quan;
                        db.collection('seeds').findOne({ _id: new ObjectId(cart[i].product) }).then((response) => {
                            quan = parseInt(response.quantity);
                            quan = quan - cart[i].quantity;
                            db.collection('seeds').updateOne({ _id: new ObjectId(response._id) }, {
                                $set: {
                                    quantity: quan.toString()
                                }
                            }).then((response) => {
                                console.log(response)
                            })
                        })
                    } else if (quant === cart[i].quantity) {
                        db.collection('seeds').findOne({ _id: new ObjectId(cart[i].product) }).then((response) => {
                            let quan = parseInt(response.quantity);
                            quan = quan - cart[i].quantity;
                            db.collection('seeds').updateOne({ _id: new ObjectId(response._id) }, {
                                $set: {
                                    quantity: quan.toString(),
                                    stock: false
                                }
                            }).then((response) => {
                                console.log(response)
                            })
                        })
                    } else {
                        flag++
                    }
                })
            })(i)
        }

        if (flag) {
            res.send({ message: 'Some Stock is not available', status: 'error' })
        } else {
            db.collection('orders').updateOne({ _id: new ObjectId(_id) }, {
                $set: {
                    status: 'Accepted'
                }
            }).then((response) => {
                res.send({ message: 'Order Accepted', status: 'ok' })
            })
        }

    })


})


exports.order = router