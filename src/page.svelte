<script>

import { fade } from 'svelte/transition';


    $: y = 100;
//     function ok () {
//    document.querySelector(".testy").style.width = y/20 ;
// }

$: z =  y*0.1;
$: x = y *0.1;

$: console.log(y)


    </script>



<h1 class="nameShop">Our Shop</h1>
<div class="main container">

<img class ="testy " width =1500 src="main2.png" alt="" > 
<!-- <div>{y}</div> -->

<!-- for normal machines -->

{#if y >100}
<div class="content nameShop opacity1" transition:fade><b>50% of Summer dresses colection</b></div>

{/if}
{#if y >350}
<div class="contentsm point  opacity1" transition:fade><p class="hov"><b>Shop now</b></p></div>

{/if}






</div>

<div class="row">
<img class="imgS2" src="sandal.png" alt="">

{#if y>900}
<div class="text-block" transition:fade>
    <h2>30% Off</h2>
    <p>Summer footware and exclusive bags</p>
  </div>

  <div class="text-block newposleft" transition:fade> <span class="oldP">220£ </span><b>  120£</b> </div>
  <div class="text-block newposright" transition:fade> <span class="oldP">350£ </span><b>  240£</b> </div>
  
  
  {/if}
<div class="middleG"></div>
<img class="imgS"  src="bag.png" alt="">
</div>




    <svelte:window bind:scrollY={y} />

   



    <style>

.oldP{

    text-decoration: line-through;
    color:black;
    padding:1rem;
}
.text-block {
    background-color: transparent;
  position: absolute;
  bottom: 20px;
text-transform: uppercase;
  font-size: 1.5rem;
  color: rgb(214, 37, 37);
  padding-left: 20px;
  padding-right: 20px;
  text-align: center;
}
.newposleft{
border:solid 1px black;
    left:6rem;
    top:5rem;
    bottom:unset;
    border-radius: 45px;
}


.newposright{
border:solid 1px black;
    right:12rem;
    top:5rem;
    bottom:unset;
    border-radius: 45px;
}

.imgS2{
    width:20rem;
    flex-basis: 40%;
}
.middleG{
    flex-basis: 20%;
    background-image: linear-gradient(to right, #eeeeee , white);
}
.imgS{
    width:20rem;
    flex-basis: 40%;
}
        .row{
border: solid 1px black;
            display:flex;
            justify-content: space-evenly;
            position:relative;
        }

        .one{
            width:3rem
        }

        .two{width:1rem}

        .hov:hover{
color:red
;

        }
.container {
  position: relative;

  margin: 0 auto; /* Center it */
  transition: all 1s;
}

.container .content {
  position: absolute; /* Position the background text */
  bottom: 1rem; /* At the bottom. Use top:0 to append it to the top */
top: 21rem;
font-size: 3rem;
  color: #f1f1f1 !important; /* Grey text */ 
  width: 20%; /* Full width */
  padding: 20px; /* Some padding */
  transition: all 1s;
}


.contentsm {
  position: absolute; /* Position the background text */
  bottom: 1rem; /* At the bottom. Use top:0 to append it to the top */
  top: 34rem;
    left: 2rem;
font-size: 2rem;
  color: #d3291b;
  width: 20%; /* Full width */
  padding: 20px; /* Some padding */
  transition: all 1s;
  text-transform: uppercase;
}



.poss{position:absolute}

        .nameShop{
            text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    font-family: futura-pt,sans-serif;
    font-weight: 300;
    font-style: normal;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1;
    font-weight: 500;
    color:black;
            text-align: center;
        }


.testy{
    overflow:hidden;
    margin-top:2rem;
   
}


.main{
    display:flex;
    margin-top: 1rem;
    justify-content: space-between;
}
       
        </style>