# IMB

[![License: CC0-1.0](https://img.shields.io/badge/License-CC0%201.0-brightgreen.svg)](http://creativecommons.org/publicdomain/zero/1.0/)
![Version](https://img.shields.io/github/package-json/v/SuperSephy/imb.svg)
![Repo Size](https://img.shields.io/github/languages/code-size/SuperSephy/imb.svg)

[![Maintainability](https://img.shields.io/codeclimate/maintainability/SuperSephy/imb.svg)](https://codeclimate.com/github/SuperSephy/imb)
![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)

Simple encoder and decoder for the USPS' IMB service based on:
- [Bob Codes: IMB](http://bobcodes.weebly.com/imb.html)

In that spirit, I've included their comment below:

> #### USPS "Intelligent Mail Barcode" Decoder
>You may use this code for any purpose, with no restrictions. 
However, there is NO WARRANTY for this code; use it at your own risk. 
This work is released under the Creative Commons Zero License. 
To view a copy of this license, visit
[http://creativecommons.org/publicdomain/zero/1.0/](http://creativecommons.org/publicdomain/zero/1.0/)

This is a simple and small module (6kb) designed to easily transform an IMB ready object to an IMB String and back again.
It supports both synchronous and asynchronous (callback) implementations.

### Encoding

Synchronous
```javascript
const imb = require('imb');

const imb_string = imb.encode({
  delivery_pt:    "",
  zip:            "",
  plus4:          "",
  barcode_id:     "12",
  service_type:   "234",
  mailer_id:      "567094",
  serial_num:     "987654321"
});

// Result
// ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT
```

Asynchronous
```javascript
const imb = require('imb');

imb.encode({
  delivery_pt:    "",
  zip:            "",
  plus4:          "",
  barcode_id:     "12",
  service_type:   "234",
  mailer_id:      "567094",
  serial_num:     "987654321"
}, (err, imb_string) => {
    if (err)
        throw new Error(err);
    
    // imb_string
    // ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT
});
```

### Decoding

Synchronous

```javascript
const imb = require('imb');

const imb_object = imb.decode("ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT");

// imb_object
// { 
//      barcode_id: '12',
//      service_type: '234',
//      mailer_id: '567094',
//      serial_num: '987654321' 
//  }
```

Asynchronous
```javascript
const imb = require('imb');

imb.decode("ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT", (err, imb_object) => {
    if (err)
        throw new Error(err);
    
    // imb_object
    // { 
    //      barcode_id: '12',
    //      service_type: '234',
    //      mailer_id: '567094',
    //      serial_num: '987654321' 
    //  }
});
```

## CLI

I have included a basic CLI that should help easily encode or decode single records.

| Option        | Descriptive   | Abbreviated   | Meaning                                               |
|---------------|---------------|:-------------:| ------------------------------------------------------|
| Type          | --type        | -t            | "encode" or "decode"                                      |
| Barcode       | --barcode     | -b            | Automatically set type to 'decode' and decode value   |


You should be able to encode an object using:

```shell
$ imb
? Would you like to encode or decode an IMB? (Use arrow keys)
    encode
  ❯ decode
? Delivery Point 2-Characters (Optional):
? Zip (Optional):
? Zip Plus 4 (Optional):
? Barcode ID: 12
? Service Type: 234
? USPS Mailer ID: 567094
? USPS Serial Number: 987654321

Encoded output
     ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT
```

And decoding an object is even easier:
```shell
$ imb
? Would you like to encode or decode an IMB? (Use arrow keys)
    encode
  ❯ decode
? Barcode String: ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT

Decoded output
     barcode_id:     12
     service_type:   234
     mailer_id:      567094
     serial_num:     987654321
```

Alternatively, Decoding is the default behavior so you can simply run:
```shell
$ imb ATTFAATTFTADFDATDDADAATTTTTTTTADFFFFFDFAFATTDAADATDDDTADAFFDFDTFT

Decoded output
	barcode_id:	12
	service_type:	234
	mailer_id:	567094
	serial_num:	987654321
```

## Support

Hey,
 
I hope that you were able to find this module helpful.
If so, let me know! Who doesn't love hearing that they made a difference, even if it's a little one.
Don't worry, it's totally free - but if it really made a difference, you can send a little love using the link below :beers:!

Cheers!

[![Beerpay](https://beerpay.io/SuperSephy/imb/badge.svg?style=beer-square)](https://beerpay.io/SuperSephy/imb)  [![Beerpay](https://beerpay.io/SuperSephy/imb/make-wish.svg?style=flat-square)](https://beerpay.io/SuperSephy/imb?focus=wish)