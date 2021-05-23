

<script>
import { fade } from 'svelte/transition';
import { slide } from 'svelte/transition';
import { createEventDispatcher } from "svelte";
import Single from './single.svelte';
import Carts from "./Carts.svelte"

import Types from './types.svelte';
import { cart } from '../Stores/stores';
export let op4

let ko ;
let disabled = true
let end = true;
let cart1 =[];
let cart2 =[];
const dispatch = createEventDispatcher();
function goSingle() {
      dispatch("nav", {
        option: "single",
        checkId: 2
      });


    }


let op2 = "empty2";
let op3 = "empty3";
let op5 ="empty4";
// ted baker
const numbers =[];
const type =[];
const price =[];
const desc =[];

// mark and spancer
const numbersM =[];
const typeM =[];
const priceM =[];
const descM =[];

// reformation
const numbersR =[];
const typeR =[];
const priceR =[];
const descR =[];

//maje
const numbersK =[];
const typeK =[];
const priceK =[];
const descK =[];

//Lily
const numbersL =[];
const typeL =[];
const priceL =[];
const descL =[];

//Hawes
const numbersH =[];
const typeH =[];
const priceH =[];
const descH =[];

//Dai
const numbersD =[];
const typeD =[];
const priceD =[];
const descD =[];


//Svarowski
const numbersS =[];
const typeS =[];
const priceS =[];
const descS =[];

//Bvlgari
const numbersB=[];
const typeB =[];
const priceB =[];
const descB =[];

//Tiffany
const numbersT=[];
const typeT =[];
const priceT =[];
const descT =[];

//Missoma
const numbersSA=[];
const typeSA =[];
const priceSA =[];
const descSA =[];


//Missoma
const numbersCA=[];
const typeCA =[];
const priceCA =[];
const descCA =[];

//Rollex
const numbersRO=[];
const typeRO =[];
const priceRO =[];
const descRO =[];


//Baume and Mercier
const numbersBA=[];
const typeBA =[];
const priceBA =[];
const descBA =[];
const cartBA =[];
//Bodycon

const numbersSBC =[];
const typeSBC =[];
const priceSBC =[];
const descSBC =[];


//off the s
const numbersSOTS =[];
const typeSOTS =[];
const priceSOTS =[];
const descSOTS =[];

const numbersSMD =[];
const typeSMD =[];
const priceSMD =[];
const descSMD =[];

const numbersSCA =[];
const typeSCA =[];
const priceSCA =[];
const descSCA =[];

const numbersSSU =[];
const typeSSU =[];
const priceSSU =[];
const descSSU =[];

const numbersSOF =[];
const typeSOF =[];
const priceSOF =[];
const descSOF =[];

const numbersSRI =[];
const typeSRI =[];
const priceSRI =[];
const descSRI =[];

const numbersSNE =[];
const typeSNE =[];
const priceSNE =[];
const descSNE =[];

const numbersSEA =[];
const typeSEA =[];
const priceSEA =[];
const descSEA =[];

const numbersSRE =[];
const typeSRE =[];
const priceSRE =[];
const descSRE =[];

const numbersSMO =[];
const typeSMO =[];
const priceSMO =[];
const descSMO =[];

const numbersSFA =[];
const typeSFA =[];
const priceSFA =[];
const descSFA =[];



document.querySelector(".superDiv").onclick = function(e) {
    finale = true ;
    end = true;
    console.log(e.srcElement.className.split(" ")[3])
  
  return  op2 = (e.srcElement.className.split(" ")[3])
}
$: op4 = op2;
let kis = true;

// document.querySelector(".containerFirm").onclick = function(e) {
//     console.log(e.srcElement.className)
    
//   return  op3 = (e.srcElement.className.split(" ")[3])
// }

const shortCutN =["Tiffany"];
const shortCut =["T"];

function goToCart(){

kis = false ;
}

let base =  [ {
    "img": "BC1F",
    "type": "Kloeey",
    "Price": "120£",
    "desc": "Samba strappy bodycon dress",
    "new": "Ted"

  },
  
  {
    "img": "BC2F",
    "type": "SHARLEY",
    "Price": "130£",
    "desc": "Jamboree bodycon dress"
    ,"new": "Ted"
  },
  {
    "img": "BC3F",
    "type": "TRIXIIY",
    "Price": "90£",
    "desc": "Pergola Bardot bodycon dress"
    ,"new": "Ted"
  },

  {
    "img": "BC4F",
    "type": "TORIIY",
    "Price": "220£",
    "desc": "Wilderness bodycon dress"
    ,"new": "Ted"
  },

  {
    "img": "BC5F",
    "type": "TILLIEY",
    "Price": "330£",
    "desc": "Cowl neck faux bodycon dress"
    ,"new": "Ted"
  },


  {
    "img": "BC6F",
    "type": "PIANA",
    "Price": "270£",
    "desc": "Urban halterneck bodycon dress"
    ,"new": "Ted"
  },

  {
    "img": "BC7F",
    "type": "SAIDIE",
    "Price": "70£",
    "desc": "Vanilla bodycon dress"
    ,"new": "Ted"
  },

  {
    "img": "BC8F",
    "type": "Bodycon Dress",
    "Price": "130£",
    "desc": "Samba strappy bodycon dress"
    ,"new": "Ted"
  },
  
  
  ]




  let markS =  [ {
    "img": "MD1F",
    "type": "Per una",
    "Price": "20£",
    "desc": "Pure Cotton Floral Maxi Tiered Dress"
    ,"new": "Mark"
  },
  
  {
    "img": "MD2F",
    "type": "Phasse Eight",
    "Price": "30£",
    "desc": "Floral V-Neck Belted Maxi Dress"
    ,"new": "Mark"
  },
  {
    "img": "MD3F",
    "type": "TRIANGLE",
    "Price": "50£",
    "desc": "Floral Round Neck Maxi T-Shirt Dress"
    ,"new": "Mark"
  },

  {
    "img": "MD4F",
    "type": "Embroidered",
    "Price": "60£",
    "desc": "Bardot Maxi Waisted Beach Dress"
    ,"new": "Mark"
  },

  {
    "img": "MD5F",
    "type": "LEAFY",
    "Price": "45£",
    "desc": "Print Maxi Shirred Beach Dress"
    ,"new": "Mark"
  },


  {
    "img": "MD6F",
    "type": "Rosalia",
    "Price": "170£",
    "desc": "Summer fever Maxi dress"
    ,"new": "Mark"
  },

  {
    "img": "MD7F",
    "type": "SAIDIE",
    "Price": "70£",
    "desc": "Vanilla bodycon dress"
    ,"new": "Mark"
  },

  {
    "img": "MD8F",
    "type": "Phase Eight",
    "Price": "130£",
    "desc": "Floral V-Neck Tie Front Midaxi Wrap Dress"
    ,"new": "Mark"
  },
  
  
  ]



// Reformation off the shoulder 
  let markR =  [ {
    "img": "OTS1F",
    "type": "Juliette Dres",
    "Price": "60£",
    "desc": "Blue cordoba"
    ,"new": "Reformation"
  },
  
  {
    "img": "OTS2F",
    "type": "Summer freedom",
    "Price": "130£",
    "desc": "Elegant but casual"
    ,"new": "Reformation"
  },
  {
    "img": "OTS3F",
    "type": "Fulton dress",
    "Price": "90£",
    "desc": "Off the shoulder dress"
    ,"new": "Reformation"
  },

  {
    "img": "OTS4F",
    "type": "Hosby dress",
    "Price": "60£",
    "desc": "For more official matters"
    ,"new": "Reformation"
  },

  //karen millen 



  
  
  ]

  
  let markK =  [ {
    "img": "MD1F",
    "type": "COTTON VOILE",
    "Price": "320£",
    "desc": "The main fabric is made from organic cotton"
    ,"new": "Maje"
  },
  
  {
    "img": "MD2F",
    "type": "Muslin",
    "Price": "430£",
    "desc": "ASYMMETRIC DRESS IN PRINTED MUSLIN"
    ,"new": "Maje"
  },
  {
    "img": "MD3F",
    "type": "RUFFLES",
    "Price": "500£",
    "desc": "SATIN DRESS WITH SMOCKING"
    ,"new": "Maje"
  },

  {
    "img": "MD4F",
    "type": "Broidered",
    "Price": "600£",
    "desc": "Black Passion"
    ,"new": "Maje"
  },

  {
    "img": "OTS1F",
    "type": "Picko",
    "Price": "245£",
    "desc": "OPENWORK DEMI DRESS"
    ,"new": "Maje"
  },


  {
    "img": "OTS2F",
    "type": "GUIPURE",
    "Price": "1070£",
    "desc": "GUIPURE AND ORGANZA DRESS"
    ,"new": "Maje"
  },

  {
    "img": "OTS3F",
    "type": "SATIN DRESS",
    "Price": "700£",
    "desc": "SATIN DRESS WITH BRAIDED STRAPS"
    ,"new": "Maje"
  },

  {
    "img": "OTS4F",
    "type": "TROMPE L’ŒIL",
    "Price": "1300£",
    "desc": "PRINTED SATIN DRESS"
    ,"new": "Maje"
  },

  {
    "img": "BC1F",
    "type": "STRETCH KNIT ",
    "Price": "300£",
    "desc": "FIGURE-HUGGING DRESS"
    ,"new": "Maje"
  },

  {
    "img": "BC2F",
    "type": "Saturn",
    "Price": "2300£",
    "desc": "PRINTED SATIN DRESS"
    ,"new": "Maje"
  },


  {
    "img": "BC3F",
    "type": "Knit Dress",
    "Price": "300£",
    "desc": "CONTRAST KNIT DRESS"
    ,"new": "Maje"
  },


  {
    "img": "BC4F",
    "type": "PLEATED GOLD",
    "Price": "9150£",
    "desc": "Lurex Dress"
    ,"new": "Maje"
  },
  
  
  ]

///svarowski

  let svarowski =  [ {
    "img": "RI1F",
    "type": "Surreal Dream Ring",
    "Price": "320£",
    "desc": "Eye, Blue, Gold-tone plated"
    ,"new": "Svarowski"
  },
  
  {
    "img": "RI2F",
    "type": "Wonder Woman Armour Ring",
    "Price": "230£",
    "desc": "White, Gold-tone plated"
    ,"new": "Svarowski"
  },
  {
    "img": "RI3F",
    "type": "Beautiful Earth ",
    "Price": "250£",
    "desc": "Green, Gold-tone plated"
    ,"new": "Svarowski"
  },

  {
    "img": "EA1F",
    "type": "Surreal Dream Pierced Earrings",
    "Price": "200£",
    "desc": "Eye, Blue, Gold-tone plated"
    ,"new": "Svarowski"
  },

  {
    "img": "EA2F",
    "type": "Wonder Woman Pierced Earrings",
    "Price": "345£",
    "desc": "Gold tone, Gold-tone plated"
    ,"new": "Svarowski"
  },


  {
    "img": "EA3F",
    "type": "Beautiful Earth Drop",
    "Price": "1070£",
    "desc": "Multicolored, Gold-tone plated"
    ,"new": "Svarowski"
  },

  {
    "img": "NE1F",
    "type": "Mesmera necklace",
    "Price": "630£",
    "desc": "Oversized crystals"
    ,"new": "Svarowski"
  },

  {
    "img": "NE2F",
    "type": "Millenia necklace",
    "Price": "500£",
    "desc": "Octagon cut crystals"
    ,"new": "Svarowski"
  },

  {
    "img": "NE3F",
    "type": "Sparkling Dance",
    "Price": "300£",
    "desc": "Large, White, Rhodium plated"
    ,"new": "Svarowski"
  },

 
  
  
  ]

///Bvlgari

let bvlgari =  [ {
    "img": "RI1F",
    "type": "SERPENTI RING",
    "Price": "37020£",
    "desc": "18k silver ring with diamonds"
    ,"new": "Bvlgari"
  },
  
  {
    "img": "RI2F",
    "type": "BVLGARI RING",
    "Price": "3230£",
    "desc": "BVLGARI BVLGARI 18 kt white gold ring set with pavé diamonds"
    ,"new": "Bvlgari"
  },
  {
    "img": "RI3F",
    "type": "B.ZERO1 RING",
    "Price": "5050£",
    "desc": "B.zero1 one-band ring in 18 kt white gold, set with pavé diamonds on the spiral"
    ,"new": "Bvlgari"
  },

  {
    "img": "EA1F",
    "type": "BVLGARI EARRINGS",
    "Price": "4200£",
    "desc": "Openwork 18 kt white gold earrings set with full pavé diamonds"
    ,"new": "Bvlgari"
  },

  {
    "img": "EA2F",
    "type": "SERPENTI EARRINGS",
    "Price": "19800£",
    "desc": "Serpenti 18 kt white gold earrings, set with a blue sapphire on the head, emerald eyes and pavé"
    ,"new": "Bvlgari"
  },


  {
    "img": "EA3F",
    "type": "SERPENTI EARRINGS",
    "Price": "24500£",
    "desc": "Serpenti earrings in 18 kt white gold, set with emerald eyes and full pavé diamonds."
    ,"new": "Bvlgari"
  },

  {
    "img": "NE1F",
    "type": "SERPENTI VIPER NECKLACE",
    "Price": "5900£",
    "desc": "Serpenti Viper pendant necklace in 18 kt white gold set with pavé diamonds"
    ,"new": "Bvlgari"
  },

  {
    "img": "NE2F",
    "type": "BVLGARI NECKLACE",
    "Price": "3470£",
    "desc": "BVLGARI  Openwork 18 kt white gold necklace set with full pavé diamonds on the pendant"
    ,"new": "Bvlgari"
  },

  {
    "img": "NE3F",
    "type": "DIVAS’ DREAM NECKLACE",
    "Price": "21300£",
    "desc": "DIVAS' DREAM 18 kt white gold openwork necklace set with a pear-shaped emerald, round brilliant-cut emeralds, a round brilliant-cut diamond and pavé diamonds."
    ,"new": "Bvlgari"
  },

  {
    "img": "NE4F",
    "type": "SERPENTI NECKLACE",
    "Price": "20900£",
    "desc": "Serpenti necklace in 18 kt white gold set with blue sapphire eyes and pavé diamonds."
    ,"new": "Bvlgari"
  },


  {
    "img": "NE5F",
    "type": "SERPENTI NECKLACE",
    "Price": "15400£",
    "desc": "Serpenti 18 kt rose gold necklace set with blue sapphire eyes."
    ,"new": "Bvlgari"
  },


  {
    "img": "NE6F",
    "type": "DIVAS’ DREAM NECKLACE",
    "Price":"3400",
    "desc": "DIVAS' DREAM 18 kt rose gold necklace set with carnelian elements."
    ,"new": "Bvlgari"
  },
  
  
  ]
 
//lilly silk
let markL =  [ {
    "img": "CA1F",
    "type": "Momme Loose",
    "Price": "220£",
    "desc": "Collarless Silk Dressing Gown"
    ,"new": "Lily"
  },
  
  {
    "img": "CA2F",
    "type": "Momme Chic",
    "Price": "330£",
    "desc": "Trimmed Silk Pyjamas Set"
    ,"new": "Lily"
  },
  {
    "img": "OF1F",
    "type": "Elegant",
    "Price": "290£",
    "desc": "V Neck Silk Dress With Pearl"
    ,"new": "Lily"
  },

  {
    "img": "OF2F",
    "type": "Charmeuse",
    "Price": "220£",
    "desc": "Partition Staple Charmeuse Silk Shirt"
    ,"new": "Lily"
  },

  


  {
    "img": "CA3F",
    "type": "Momme Lace",
    "Price": "90£",
    "desc": "Momme Lace Silk Camisole Set"
    ,"new": "Lily"
  },

  {
    "img": "OF3F",
    "type": "Bowie",
    "Price": "170£",
    "desc": "Concise Silk Bow Tie Blouse"
    ,"new": "Lily"
  },


  
  
  ]



  //Hawes
let markH =  [ {
    "img": "OF1F",
    "type": "Boutique White",
    "Price": "59£",
    "desc": " Semi Fitted Button Loop Shirt"
    ,"new": "Hawes"
  },
  
  {
    "img": "OF2F",
    "type": "Single Cuff",
    "Price": "39£",
    "desc": "White Fitted Shirt with High Two Button Collar"
    ,"new": "Hawes"
  },
  {
    "img": "OF3F",
    "type": "Ice Blue ",
    "Price": "59£",
    "desc": "Fitted Shirt with High Long Collar "
    ,"new": "Hawes"
  },

  {
    "img": "OF4F",
    "type": "Pussy Bow",
    "Price": "45£",
    "desc": "Women's Black Fitted Satin Blouse"
    ,"new": "Hawes"
  },

  


  {
    "img": "OF5F",
    "type": "3 Quarter Sleeve",
    "Price": "30£",
    "desc": "White Fitted Cotton Shirt"
    ,"new": "Hawes"
  },

  {
    "img": "OF6F",
    "type": "Black Fitted Shirt",
    "Price": "70£",
    "desc": "Fitted Stretch Shirt - Single Cuff"
    ,"new": "Hawes"
  },


  
  
  ]

//dai
  let markD =  [ {
    "img": "OF1F",
    "type": "Fundamental Dress Black",
    "Price": "259£",
    "desc": " The everyday staple dress"
    ,"new": "Dai"
  },
  
  {
    "img": "OF2F",
    "type": "Trail Blazer™",
    "Price": "325£",
    "desc": "The ultimate power jacket"
    ,"new": "Dai"
  },
  {
    "img": "OF3F",
    "type": "Eco Layer On Top Ivory",
    "Price": "110£",
    "desc": "Feels good and mirrors nature's circle of life "
    ,"new": "Dai"
  },

  {
    "img": "OF4F",
    "type": "Thinking Cap Dress",
    "Price": "275£",
    "desc": "Cap sleeve dress with ruffle-effect side panels"
    ,"new": "Dai"
  },

  


  {
    "img": "OF5F",
    "type": "Victory Dress Black",
    "Price": "245£",
    "desc": "V is for Victory dress"
    ,"new": "Dai"
  },

  {
    "img": "OF6F",
    "type": "Eco Layer On Top Black",
    "Price": "110£",
    "desc": "Feels good and mirrors nature's circle of life"
    ,"new": "Dai"
  },


  
  
  ]


  let tiffany =  [ {
    "img": "RI1F",
    "type": "JENNY PACKHAM",
    "Price": "400£",
    "desc": " 9CT WHITE GOLD 0.10CTTW DIAMOND RING"
    ,"new": "Tiffany"
  },
  
  {
    "img": "RI2F",
    "type": "Fine Jewelry Rose™",
    "Price": "999£",
    "desc": "Gold Diamond Belle Ring"
    ,"new": "Tiffany"
  },
  {
    "img": "RI3F",
    "type": "Diamond Solitaire Twist Ring",
    "Price": "499£",
    "desc": "9ct White Gold 0.33ct Total"
    ,"new": "Tiffany"
  },


  
  
  ]


  let missoma =  [ {
    "img": "RI1F",
    "type": "Lucy williams",
    "Price": "69£",
    "desc": " malachite square gold signet ring"
    ,"new": "Missoma"
  },
  
  {
    "img": "RI2F",
    "type": "bombé raffia ring™",
    "Price": "299£",
    "desc": "Gold Belle Ring"
    ,"new": "Missoma"
  },
  {
    "img": "RI3F",
    "type": "Signet ring",
    "Price": "149£",
    "desc": "fused silver black onyx round"
    ,"new": "Missoma"
  },

  {
    "img": "NE1F",
    "type": "Heart",
    "Price": "149£",
    "desc": "ridge heart necklace"
    ,"new": "Missoma"
  },
  {
    "img": "NE2F",
    "type": "Lucy williams",
    "Price": "149£",
    "desc": "gold roman arc coin necklace"
    ,"new": "Missoma"
  },
  {
    "img": "NE3F",
    "type": "Lucy williams",
    "Price": "249£",
    "desc": "square malachite necklace"
    ,"new": "Missoma"
  },
  {
    "img": "EA1F",
    "type": "Lucy williams",
    "Price": "39£",
    "desc": "baya hoop earrings"
    ,"new": "Missoma"
  },
  {
    "img": "EA2F",
    "type": "Helical hoop",
    "Price": "59£",
    "desc": "gold mini helical hoop earrings"
    ,"new": "Missoma"
  },
  {
    "img": "EA3F",
    "type": "Lucy williams",
    "Price": "165£",
    "desc": "snake chain drop earrings"
    ,"new": "Missoma"
  }
  ]
  let chanel =  [ {
    "img": "MO1F",
    "type": "CHANEL J12",
    "Price": "6900£",
    "desc": " AUTOMATIC LADIES WATCH"
    ,"new": "Chanel"
  },
  
  {
    "img": "FA1F",
    "type": "CHANEL CODE COCO ",
    "Price": "7299£",
    "desc": " STEEL AND DIAMOND H5145 38X21.5MM"
    ,"new": "Chanel"
  },
  {
    "img": "FA2F",
    "type": "CHANEL PREMIERE",
    "Price": "6500£",
    "desc": "STEEL AND ONYX WATCH"
    ,"new": "Chanel"
  },

  {
    "img": "RE1F",
    "type": "CHANEL BOY-FRIEND",
    "Price": "11000",
    "desc": "BEIGE GOLD H4313 27X35MM"
    ,"new": "Chanel"
  },
  {
    "img": "MO2F",
    "type": "CHANEL BOY-FRIEND",
    "Price": "6100£",
    "desc": "DIAMOND H4883 28X21.5MM"
    ,"new": "Chanel"
  },
  
  
  
  
  ]


  let rolex =  [ {
    "img": "FA1F",
    "type": "PEARLMASTER 39",
    "Price": "16900£",
    "desc": " Oyster, 39 mm, white gold and diamonds"
    ,"new": "Rolex"
  },

  {
    "img": "FA2F",
    "type": "LADY-DATEJUST",
    "Price": "15000£",
    "desc": "Oyster, 28 mm, Oystersteel"
    ,"new": "Rolex"
  },

  {
    "img": "FA3F",
    "type": "LADY-DATEJUST",
    "Price": "16900£",
    "desc": " Oyster, 28 mm, Everose gold and diamonds"
    ,"new": "Rolex"
  },

  {
    "img": "FA4F",
    "type": "LADY-DATEJUST",
    "Price": "9200£",
    "desc": " Oyster, 28 mm, Oystersteel and yellow gold"
    ,"new": "Rolex"
  },

  {
    "img": "FA5F",
    "type": "DATEJUST 31",
    "Price": "37900£",
    "desc": " Oyster, 31 mm, white gold and diamonds"
    ,"new": "Rolex"
  },


  {
    "img": "FA6F",
    "type": "DATEJUST 31",
    "Price": "6500£",
    "desc": " Oyster, 31 mm, Oystersteel and white gold"
    ,"new": "Rolex"
  },


  {
    "img": "MO1F",
    "type": "DAY-DATE 36",
    "Price": "48150£",
    "desc": " Oyster, 36 mm, Everose gold and diamonds"
    ,"new": "Rolex"
  },


]



let baume =  [ {
    "img": "RE1F",
    "type": "Classima ",
    "Price": "2400£",
    "desc": "27mm Ladies Watch "
    ,"new": "Baume",
    "cart": 0
  },

  {
    "img": "RE2F",
    "type": "Classima",
    "Price": "15000£",
    "desc": "31mm Ladies Watch "
    ,"new": "Baume",
    "cart": 0
  },

  {
    "img": "RE3F",
    "type": "Classima ",
    "Price": "940£",
    "desc": " 36.5mm Ladies Watch"
    ,"new": "Baume",
    "cart": 0
  },



]
// let cus = ["base","markS","markR","markK"]
// let cus2 = ["","M","R","K"]
//   $: console.log(base.img);
// for (let j = 0 ; j <= cus.length-1 ; j++){

//   for (let i = 0; i<=6; i++){
      
//       (numbers+cus2[j]).push(cus[j].img)
//       type+cus2[j].push(cus[j].type)
//       price+cus2[j].push(cus[j].Price)
//       desc+cus2[j].push(cus[j].desc)
//       console.log(numbers)
//       }

// }


  for (let i = 0; i<=6; i++){
      
numbers.push(base[i].img)
type.push(base[i].type)
price.push(base[i].Price)
desc.push(base[i].desc)

}


for (let i = 0; i<=6; i++){
      
      numbersM.push(markS[i].img)
      typeM.push(markS[i].type)
      priceM.push(markS[i].Price)
      descM.push(markS[i].desc)
      
      }


      for (let i = 0; i<=3; i++){
      
      numbersR.push(markR[i].img)
      typeR.push(markR[i].type)
      priceR.push(markR[i].Price)
      descR.push(markR[i].desc)
      
      }

      for (let i = 0; i<=11; i++){
      
      numbersK.push(markK[i].img)
      typeK.push(markK[i].type)
      priceK.push(markK[i].Price)
      descK.push(markK[i].desc)
     
      }


      for (let i = 0; i<=5; i++){
      
      numbersL.push(markL[i].img)
      typeL.push(markL[i].type)
      priceL.push(markL[i].Price)
      descL.push(markL[i].desc)
     
      }

      
      for (let i = 0; i<=5; i++){
      
      numbersH.push(markH[i].img)
      typeH.push(markH[i].type)
      priceH.push(markH[i].Price)
      descH.push(markH[i].desc)
 
      }


      for (let i = 0; i<=5; i++){
      
      numbersD.push(markD[i].img)
      typeD.push(markD[i].type)
      priceD.push(markD[i].Price)
      descD.push(markD[i].desc)
    
      }

      for (let i = 0; i<=8 ; i++){
      
      numbersS.push(svarowski[i].img)
      typeS.push(svarowski[i].type)
      priceS.push(svarowski[i].Price)
      descS.push(svarowski[i].desc)
    
      }

      for (let i = 0; i<=11 ; i++){
      
      numbersB.push(bvlgari[i].img)
      typeB.push(bvlgari[i].type)
      priceB.push(bvlgari[i].Price)
      descB.push(bvlgari[i].desc)
    
      }


      for (let i = 0; i<=2 ; i++){
      
      numbersT.push(tiffany[i].img)
      typeT.push(tiffany[i].type)
      priceT.push(tiffany[i].Price)
      descT.push(tiffany[i].desc)
    
      }


      for (let i = 0; i<=8 ; i++){
      
      numbersSA.push(missoma[i].img)
      typeSA.push(missoma[i].type)
      priceSA.push(missoma[i].Price)
      descSA.push(missoma[i].desc)
    
      }


      
      for (let i = 0; i<=4 ; i++){
      
      numbersCA.push(chanel[i].img)
      typeCA.push(chanel[i].type)
      priceCA.push(chanel[i].Price)
      descCA.push(chanel[i].desc)
    
      }

      for (let i = 0; i<=6 ; i++){
      
      numbersRO.push(rolex[i].img)
      typeRO.push(rolex[i].type)
      priceRO.push(rolex[i].Price)
      descRO.push(rolex[i].desc)
    
      }

      for (let i = 0; i<=2 ; i++){
      
      numbersBA.push(baume[i].img)
      typeBA.push(baume[i].type)
      priceBA.push(baume[i].Price)
      descBA.push(baume[i].desc)
      cartBA.push(baume[i].cart)
    
      }


function mark(element,value,arr){
return value[arr.indexOf(element)]


}

function markM(element,value){
return value[numbersM.indexOf(element)]


}
let much ;
let finale = true;
function falsy(){
finale = false;

}



let whole =[];
let boxBelow ;
let items = ['Bodycon', 'offtheshoulder', 'maxidress', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', "eleven", "tvelve", "13","14","15",16,17,18,19];
  let itemsF = ['Bodycon', 'Off The Shoulder', 'Maxi Dress', 'Casual', 'Summer', 'Official', 'Rings', 'Necklace', 'Earings', 'Retro', "Modern", "Fantasy", 13,14,15,16,17,18,19];
  let itemsS = ["BC","OTS","MD","CA","SU","OF","RI","NE","EA","RE","MO","FA"]
let supers = [markD, markH,markL,markK,markR,markS,base,svarowski,bvlgari,tiffany,missoma,chanel,rolex,baume];
console.log(markD)

function doom(e,eve){
  
for (let i = 0; i<supers.length;i++){
let sizes = supers[i].map(car => {
  if (car.img.includes(e) ){
    
   
    
   
    return eval("numbersS" +e).push(car.new+"/"+car.img);
  }})}


}
function doom2(e,eve){
 
for (let i = 0; i<supers.length;i++){
let sizes = supers[i].map(car => {
  if (car.img.includes(e) ){
  
    return eval("priceS" +e).push(car.Price);
  }})}
}

function doom3(e,eve){
 
 for (let i = 0; i<supers.length;i++){
 let sizes = supers[i].map(car => {
   if (car.img.includes(e) ){
 
     return eval("descS" +e).push(car.desc);
   }})}
 }

 function doom4(e,eve){
 
 for (let i = 0; i<supers.length;i++){
 let sizes = supers[i].map(car => {
   if (car.img.includes(e) ){
     
     return eval("typeS" +e).push(car.type);
   }})}
 }



for (let i = 0; i<=11 ; i++){
doom(itemsS[i]);
doom2(itemsS[i]);
doom3(itemsS[i]);
doom4(itemsS[i]);

}


// if (document.querySelector(".Bodyconx") !== null){
// console.log(document.querySelector(".Bodyconx").innerHTML);}

//  if (document.querySelector("."+items[0]+"x") !== null){
// document.querySelector(".Bodyconx").addEventListener("click",function(){


// })}

function opz (e){

 return op5 =e.substr(0, e.indexOf('/'));
  
 
}

function opy(e){
console.log(e.substr( e.indexOf('/')+1,e.length))
 return e.substr( e.indexOf('/')+1,e.length);

}


</script>
{#if end === true}
{#if finale === true }



{#if op2==="Ted"}



<h1 transition:slide class="mainDiv">{op2} Baker</h1>

<div class="containerFirm"  >

{#each numbers as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML,much = e.srcElement.className.split(" ")[1], falsy(), goSingle()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,type,numbers)}</p><p class="mark2">{mark(item,desc,numbers)}</p><p class="mark3">{mark(item,price,numbers)}</p></div></div>
   
{/each}



</div>
{:else if op2=== "Mark"}
<h1 transition:slide class="mainDiv">{op2} & Spancer</h1>

<div class="containerFirm">

{#each numbersM as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeM,numbersM)}</p><p class="mark2">{mark(item,descM,numbersM)}</p><p class="mark3">{mark(item,priceM,numbersM)}</p></div></div>
{/each}



</div>


{:else if op2=== "Reformation"}
<h1 transition:slide class="mainDiv">{op2}</h1>

<div class="containerFirm">

{#each numbersR as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeR,numbersR)}</p><p class="mark2">{mark(item,descR,numbersR)}</p><p class="mark3">{mark(item,priceR,numbersR)}</p></div></div>
{/each}



</div>


{:else if op2=== "Maje"}
<h1 transition:slide class="mainDiv">{op2} Paris</h1>

<div class="containerFirm">

{#each numbersK as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeK,numbersK)}</p><p class="mark2">{mark(item,descK,numbersK)}</p><p class="mark3">{mark(item,priceK,numbersK)}</p></div></div>
{/each}



</div>



{:else if op2=== "Lily"}
<h1 transition:slide class="mainDiv">{op2} Silk</h1>

<div class="containerFirm">

{#each numbersL as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeL,numbersL)}</p><p class="mark2">{mark(item,descL,numbersL)}</p><p class="mark3">{mark(item,priceL,numbersL)}</p></div></div>
{/each}



</div>


{:else if op2=== "Hawes"}
<h1 transition:slide class="mainDiv">{op2} Silk</h1>

<div class="containerFirm">

{#each numbersH as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeH,numbersH)}</p><p class="mark2">{mark(item,descH,numbersH)}</p><p class="mark3">{mark(item,priceH,numbersH)}</p></div></div>
{/each}



</div>


{:else if op2=== "Dai"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersD as item }
    <div transition:fade on:click={(e) => {console.log(op2+item);boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeD,numbersD)}</p><p class="mark2">{mark(item,descD,numbersD)}</p><p class="mark3">{mark(item,priceD,numbersD)}</p></div></div>
{/each}



</div>

{:else if op2=== "Svarowski"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersS as item }
    <div transition:fade on:click={(e) => {console.log(op2+item);boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeS,numbersS)}</p><p class="mark2">{mark(item,descS,numbersS)}</p><p class="mark3">{mark(item,priceS,numbersS)}</p></div></div>
{/each}



</div>

{:else if op2=== "Bvlgari"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersB as item }
    <div transition:fade on:click={(e) => {console.log(op2+item);boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeB,numbersB)}</p><p class="mark2">{mark(item,descB,numbersB)}</p><p class="mark3">{mark(item,priceB,numbersB)}</p></div></div>
{/each}



</div>


{:else if op2=== "Tiffany"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersT as item }
    <div transition:fade on:click={(e) => {console.log(op2+item);boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeT,numbersT)}</p><p class="mark2">{mark(item,descT,numbersT)}</p><p class="mark3">{mark(item,priceT,numbersT)}</p></div></div>
{/each}



</div>



{:else if op2=== "Missoma"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersSA as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeSA,numbersSA)}</p><p class="mark2">{mark(item,descSA,numbersSA)}</p><p class="mark3">{mark(item,priceSA,numbersSA)}</p></div></div>
{/each}



</div>


{:else if op2=== "Chanel"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersCA as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeCA,numbersCA)}</p><p class="mark2">{mark(item,descCA,numbersCA)}</p><p class="mark3">{mark(item,priceCA,numbersCA)}</p></div></div>
{/each}



</div>


{:else if op2=== "Rolex"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersRO as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeRO,numbersRO)}</p><p class="mark2">{mark(item,descRO,numbersRO)}</p><p class="mark3">{mark(item,priceRO,numbersRO)}</p></div></div>
{/each}



</div>

{:else if op2=== "Baume"}
<h1 transition:slide class="mainDiv">{op2} </h1>

<div class="containerFirm">

{#each numbersBA as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+op2+item).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {item}" src="{op2}/{item}.png" alt=""><div class="contentPic {op2}{item}"> <p class="mark1">{mark(item,typeBA,numbersBA)}</p><p class="mark2">{mark(item,descBA,numbersBA)}</p><p class="mark3">{mark(item,priceBA,numbersBA)}</p></div></div>
{/each}



</div>




{:else if op2=== "Bodyconx"}
<h1 transition:slide class="mainDiv">Bodycon Dresses </h1>

<div class="containerFirm">

{#each numbersSBC as item }
    <div transition:fade on:click={(e) => {boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSBC,numbersSBC)}</p><p class="mark2">{mark(item,descSBC,numbersSBC)}</p><p class="mark3">{mark(item,priceSBC,numbersSBC)}</p></div></div>
{/each}



</div>

{:else if op2=== "offtheshoulderx"}
<h1 transition:slide class="mainDiv">Off The Shoulder </h1>

<div class="containerFirm">

{#each numbersSOTS as item }
    <div transition:fade on:click={(e) => { boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSOTS,numbersSOTS)}</p><p class="mark2">{mark(item,descSOTS,numbersSOTS)}</p><p class="mark3">{mark(item,priceSOTS,numbersSOTS)}</p></div></div>
{/each}



</div>

{:else if op2=== "maxidressx"}
<h1 transition:slide class="mainDiv">Maxi Dress </h1>

<div class="containerFirm">

{#each numbersSMD as item }
    <div transition:fade on:click={(e) => { boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSMD,numbersSMD)}</p><p class="mark2">{mark(item,descSMD,numbersSMD)}</p><p class="mark3">{mark(item,priceSMD,numbersSMD)}</p></div></div>
{/each}



</div>




{:else if op2=== "fourx"}
<h1 transition:slide class="mainDiv">Casual  </h1>

<div class="containerFirm">

{#each numbersSCA as item }
    <div transition:fade on:click={(e) => { boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSCA,numbersSCA)}</p><p class="mark2">{mark(item,descSCA,numbersSCA)}</p><p class="mark3">{mark(item,priceSCA,numbersSCA)}</p></div></div>
{/each}



</div>



{:else if op2=== "fivex"}
<h1 transition:slide class="mainDiv">Summer outfits </h1>

<div class="containerFirm">

{#each numbersSSU as item }
    <div transition:fade on:click={(e) => { boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSSU,numbersSSU)}</p><p class="mark2">{mark(item,descSSU,numbersSSU)}</p><p class="mark3">{mark(item,priceSSU,numbersSSU)}</p></div></div>
{/each}



</div>


{:else if op2=== "sixx"}
<h1 transition:slide class="mainDiv">Oficcial Outfits </h1>

<div class="containerFirm">

{#each numbersSOF as item }
    <div transition:fade on:click={(e) => {console.log(item); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSOF,numbersSOF)}</p><p class="mark2">{mark(item,descSOF,numbersSOF)}</p><p class="mark3">{mark(item,priceSOF,numbersSOF)}</p></div></div>
{/each}



</div>

{:else if op2=== "sevenx"}
<h1 transition:slide class="mainDiv">Rings</h1>

<div class="containerFirm">

{#each numbersSRI as item }
    <div transition:fade on:click={(e) => {console.log(item); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSRI,numbersSRI)}</p><p class="mark2">{mark(item,descSRI,numbersSRI)}</p><p class="mark3">{mark(item,priceSRI,numbersSRI)}</p></div></div>
{/each}



</div>


{:else if op2=== "eightx"}
<h1 transition:slide class="mainDiv">Rings</h1>

<div class="containerFirm">

{#each numbersSNE as item }
    <div transition:fade on:click={(e) => {console.log(item); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSNE,numbersSNE)}</p><p class="mark2">{mark(item,descSNE,numbersSNE)}</p><p class="mark3">{mark(item,priceSNE,numbersSNE)}</p></div></div>
{/each}



</div>



{:else if op2=== "ninex"}
<h1 transition:slide class="mainDiv">Rings</h1>

<div class="containerFirm">

{#each numbersSEA as item }
    <div transition:fade on:click={(e) => {console.log(item); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSEA,numbersSEA)}</p><p class="mark2">{mark(item,descSEA,numbersSEA)}</p><p class="mark3">{mark(item,priceSEA,numbersSEA)}</p></div></div>
{/each}



</div>



{:else if op2=== "tenx"}
<h1 transition:slide class="mainDiv">Retro Watches</h1>

<div class="containerFirm">

{#each numbersSRE as item }
    <div transition:fade on:click={(e) => {console.log(item); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSRE,numbersSRE)}</p><p class="mark2">{mark(item,descSRE,numbersSRE)}</p><p class="mark3">{mark(item,priceSRE,numbersSRE)}</p></div></div>
{/each}



</div>

{:else if op2=== "elevenx"}
<h1 transition:slide class="mainDiv">Modern Watches</h1>

<div class="containerFirm">

{#each numbersSMO as item }
    <div transition:fade on:click={(e) => {console.log(item); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSMO,numbersSMO)}</p><p class="mark2">{mark(item,descSMO,numbersSMO)}</p><p class="mark3">{mark(item,priceSMO,numbersSMO)}</p></div></div>
{/each}



</div>


{:else if op2=== "tvelvex"}
<h1 transition:slide class="mainDiv">{op2}</h1>

<div class="containerFirm">

{#each numbersSFA as item }
    <div transition:fade on:click={(e) => { ko = mark(item,priceSFA,numbersSFA); boxBelow = document.querySelector("."+opz(item)+opy(item)).innerHTML ,much = e.srcElement.className.split(" ")[1],falsy()}} class="flex-col"><img class="imgC {opy(item)}" src="{item}.png" alt=""><div class="contentPic {opz(item)}{opy(item)}"> <p class="mark1">{mark(item,typeSFA,numbersSFA)}</p><p class="mark2">{mark(item,descSFA,numbersSFA)}</p><p class="mark3">{mark(item,priceSFA,numbersSFA)}</p></div></div>
{/each}



</div>

{/if}
<!-- let items = ['Bodycon', 'offtheshoulder', 'maxidress', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', "eleven", "tvelve", "13","14","15",16,17,18,19]; -->



<!-- {:else}
<h1 class="mainDiv">Ted Baker</h1>

<div class="containerFirm">
    {#each numbers as item}
    <div class="flex-col"><img class="imgC" src="Ted/{item}.png" alt=""><div class="contentPic">content</div></div>
;{/each}
</div> -->

<!-- <Single disabled={disabled}/> -->
{:else}
<Single much={much} op2={op2} boxBelow ={boxBelow} op5={op5} ko = {ko} cart1 = {cart1} cart2 = {cart2}/>
{/if}
{:else}
<Types />
{/if}

{#if kis === false }
<Carts much ={much} op2 ={op2} ko={ko} boxBelow = {boxBelow} op4 = {op4} op5={op5} cart1 ={cart1} cart2 = {cart2}/>
{/if}

<style>
.imgC{

   width:23rem;
}

.contentPic{
  display:flex;
  flex-direction: column;
  text-align: center;
  font-size: 1.2rem;
  border: solid 1px grey;
}

.mark1{
    text-transform: uppercase;
   font-weight: bold;
}

.mark2{
font-weight: lighter;
font-style: italic;
max-width:20rem;
align-self:center;

}

.mark3{
    text-align: center;
    color:red;
}


    .containerFirm {

display:flex;
justify-content: space-evenly;
flex-wrap: wrap;

    }

    .flex-col{
   
     margin: 1rem;
    }
.mainDiv{text-align: center;}


.flip-container {
            margin: 50px;
            perspective: 1000px;
            display: inline-block;
        }
        .flip-container:hover .card {
            transform: rotateY(180deg);
        }
        .card, .front, .back {
            width: 130px;
            height: 195px;
        }
        .card {
            position: relative;
            transition: 0.5s all;
            transform-style: preserve-3d;
        }
        .front, .back {
            position: absolute;
            backface-visibility: hidden;
        }
        .front {
            z-index: 1;
            transform: rotateY(180deg);
        }
        .back {
            z-index: 2;
            transform: rotateY(0deg);
        }
</style>