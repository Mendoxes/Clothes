

<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import Carts from "./Carts.svelte"
	import { slide } from 'svelte/transition';
  import Box from './firms.svelte';
  let op ;
// export const op = "empty";
  window.click = function(e) {
    console.log(e.srcElement.className)
    console.log(e.srcElement.className.split(" ")[3]);
  return  op = (e.srcElement.className.split(" ")[3])
}
  const dispatch = createEventDispatcher();
  let mobileMenu = false;
let k = 1 ;
let cur ;
function goToHome() {
      dispatch("nav", {
        option: "home",
        checkId: 2
      });


    }

    function clicks(){

      console.log("ok")
    }

    function goToCheckout() {
      dispatch("nav", {
        option: "checkout"
      });
    }
    // function goToCarts() {
    //   dispatch("nav", {
    //     option: "carts",
       
    //   });}

    function goToFirms() {
      dispatch("nav", {
        option: "firms",
        checkId: 1
      });

      
   


   


      document.querySelector(".superDiv").style.opacity = 0 ;
      document.querySelector(".superDiv").style.display = "none";
    }
      function checkFirm(eve){
console.log(eve);
      }
    

  const navItems = [
    { label: "Dress", href: "#",id:1 },
    { label: "Clothing", href: "#",id:2 },
    { label: "Jewelery", href: "#",id:3 },
    { label: "Watches", href: "#",id:4 },
    // { label: "Bags", href: "#", id:5 },
    { label: "Home", href: "#" }
  ];

  const firms = ["Ted Baker", "Mark & Spancer", "Reformation", "Maje", "Zara"]
  const firmsC = ["Lily Silk", "Hawes & Curtis", "Dai",]
  const firmsJ = ["Svarowski", "Bvlgari", "Tiffany", "Missoma"]
  const firmsW =["Chanel", "Rolex","Baume & Mercier"]

  const handleMobileIconClick = () => (mobileMenu = !mobileMenu);
let showW = true;
  let current = 'foo';
 
  const mediaQueryHandler = e => {
    if (!e.matches) {
      mobileMenu = false;
    }
  };
  function changeI(item) {
console.log({item});

document.querySelector("."+item.item).src =item.item+"1.png";
// document.querySelector("."+item.item +1).classList.toggle("hidden");
// document.querySelector("."+item.item +1).classList.toggle("display")
// document.querySelector("."+item.item).classList.toggle("display");

 }


  onMount(() => {
    const mediaListener = window.matchMedia("(max-width: 767px)");

    mediaListener.addListener(mediaQueryHandler);
  });
  let showItems = false;
  
  let items = ['Bodycon', 'offtheshoulder', 'maxidress', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', "eleven", "tvelve", "13","14","15",16,17,18,19];
  let itemsF = ['Bodycon', 'Off The Shoulder', 'Maxi Dress', 'Casual', 'Summer', 'Official', 'Rings', 'Necklace', 'Earings', 'Retro', "Modern", "Fantasy", 13,14,15,16,17,18,19];
  let i = 5;
let lo ="";

  function Dress(){
   return showItems = !showItems ;
   
  }
let quinq = []
let quinqq = []
  function reduceMe(elem){
    
return quinq = items.slice(elem*3-3,elem*3)

  } 

  function reduceThem (e){

 return quinqq = itemsF.slice(e*3-3,e*3)
  }


function mark(element){
return itemsF[items.indexOf(element)]


}

</script>



<!-- {#if showItems}
	{#each quinq.slice(0, quinq.length) as item}
		<div class= transition:slide>
			{item}
		</div>
	{/each}
{/if} -->

<nav>
  <div class="inner">
    <div on:click={handleMobileIconClick} class={`mobile-icon${mobileMenu ? ' active' : ''}`}>
      <div class="middle-line"></div>
    </div>
    <ul class={`navbar-list${mobileMenu ? ' mobile' : ''}`}>
      
      {#each navItems as item}
        <li>
          <a on:mouseover={() => { document.querySelector(".superDiv").style.opacity = 1 ;document.querySelector(".superDiv").style.display = "flex" ;cur = item.label;console.log(reduceMe(item.id)); reduceThem(item.id)
            showItems = true}} href={item.href}>{item.label} </a> 
        </li>
      {/each}
      
    </ul>
 

  </div>
 
  <div  class="transition:slide superDiv" on:mouseleave={() => {document.querySelector(".superDiv").style.opacity = 0 }}>
<!-- firms on the left side of onmousemove -->



{#if showItems}

{#if cur == navItems[0].label}
<div class="firms">
    {#each firms.slice(0, firms.length) as item}
		<div class= "transition:slide point ok {item}" on:click ={goToFirms}>
			{item}
		</div>
	{/each}
  </div>
  

  {:else if cur == navItems[1].label}
  <div class="firms">
      {#each firmsC.slice(0, firmsC.length) as item}
      <div class= "transition:slide point ok {item}" on:click ={goToFirms}>
        {item}
      </div>
    {/each}
    </div>

    {:else if cur == navItems[2].label}
    <div class="firms">
        {#each firmsJ.slice(0, firmsJ.length) as item}
        <div class= "transition:slide point ok {item}" on:click ={goToFirms}>
          {item}
        </div>
      {/each}
      </div>

      {:else if cur == navItems[3].label}
  <div class="firms">
      {#each firmsW.slice(0, firmsW.length) as item}
      <div class= "transition:slide point ok {item}" on:click ={goToFirms}>
        {item}
      </div>
    {/each}
    </div>

    <!-- {:else if cur == navItems[4].label}
  <div class="firms">
      {#each firmsB.slice(0, firmsB.length) as item}
      <div class= "transition:slide point ok {item}" on:click ={goToFirms}>
        {item}
      </div>
    {/each}
    </div> -->

    {/if}


  {/if}
  
    <!-- sample images -->
    {#each quinq.slice(0, quinq.length) as item}
		<div class= "transition:slide  miniDiv">
		 <img class = "imgWige jeden dwa {item}" src="{item}.png" alt="" on:mouseenter= {changeI({item})}>
     <!-- <img class = "imgWige hidden display jeden dwa {item + 1}" src="{item}1.png" alt="" > -->
  <button on:click={goToFirms} class="trzy jeden dwa {item}x">{mark(item)}</button>
		</div>
    {/each}
    <!-- {#each quinqq.slice(0,quinqq.length) as itemF}
    <p class="{itemF}">{itemF}</p>
    {/each} -->

 


</div>

</nav>
<!-- bp = "offset-15@md 4@md 12@sm" -->
<style>

  .jeden{

    border-radius: 11%;
    display: table-caption;
    margin: 10px;
  
    box-shadow: 10px 10px 8px 10px #888888;
  }
.trzy{
position:relative;
  cursor:pointer;
left:0;
background-color: #d5eeffb3;
transition: all 1s;
}

.trzy:hover{
border-radius: 50%;
background-color: white;
}

.trzy:active {
  background-color: white;
  box-shadow: 0 5px rgb(255, 251, 251);
  transform: translateY(4px);
  border:none;
}


/* .trzy:{
left:1rem;
-ms-transform-origin-x: 2px;

} */

a:after {    
  background: none repeat scroll 0 0 transparent;
  bottom: 0;
  content: "";
  display: block;
  height: 1px;
  left: 50%;
  position: absolute;
  background: #fff;
  transition: width 0.3s ease 0s, left 0.3s ease 0s;
  width: 0;
}
a:hover:after { 
  width: 100%; 
  left: 0; 
}


.firms{


  display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    flex-basis: 30%;
    text-align: start;
    padding:1rem;

}

.ok{
  transition: all 2s;
  position:relative;
  left:0rem;
  font-style:normal;

}
.ok:hover{
font-kerning: normal;
font-style: italic;
left:2rem;



}

  .imgWige{
    width: 10rem;
    height: 13rem;
    border-radius: 20%;
    transition: opacity 2s;
  }

  .miniDiv{
  
display:inline-block;
padding:1rem;

  }
  .superDiv{
    display: flex;
z-index:9000;
    flex-direction: row;
background-color: white;
position:relative;
color:black;
text-align: center;

box-shadow: 5px 10px 8px #888888;
transition: all 1s;

  }
  nav {
    background-color: rgba(0, 0, 0, 0.8);
    font-family: "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    height: 45px;
  }

  .inner {
    max-width: 980px;
    padding-left: 20px;
    padding-right: 20px;
    margin: auto;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: 100%;
  }


.cart{

  color:white;
}
 
</style>