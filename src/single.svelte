<script>
    import CheckoutItem from "./CheckoutItem.svelte"
    import { fade } from 'svelte/transition';
 import Carts from "./Carts.svelte"
  import { cart } from "../Stores/stores.js";

  import { get } from "svelte/store";
	import { count, double, user } from "../stores/Stores.js"


// export let disabled
export let much
export let op2
export let boxBelow
export let op5
export let ko   ///PRICE FOR AN ITEM 
export let cart1 
export let cart2 


// ko = Number(ko.substring(0,ko.length - 1));
// $: console.log(ko);
console.log(get(count))
	console.log(get(double))
	console.log(get(user))
let op4; 
op4 = much ;
console.log(op2)
console.log(op4);

let r = /\d+/;
let s = op4;
// let match = (s.match(r));
let a = 6
const values = [1,1,1,1,1,0,0,0,0]
console.log(boxBelow);
function reple(e){

return op4 = much.replace(/.$/,e)
}

function addTo(a,b){

console.log(boxBelow);

}
let finale =true;

function falsy(){
finale = false;

}
let name = op5

// reple("F");
// console.log(op4);
</script>
{#if finale === true }
{#if op2 ==="Bodyconx" || op2 === "offtheshoulderx" || op2==="maxidressx" ||op2==="fourx"||op2==="fivex"||op2==="sixx"|| op2==="sevenx"|| op2==="eightx"||op2==="ninex"||op2==="tenx"||op2==="elevenx"||op2==="tvelvex"}
<div transition:fade  class="start"><img transition:fade class="checkin" src="{op5}/{much}.png" alt="">
    <div transition:fade  class="contentPic">{@html boxBelow} <div  transition:fade class="smallFlex">
<img on:click={(e)=>{document.querySelector(".checkin").src =op5+"/"+reple("B")+".png"}} class="imgC" src="{op5}/{reple("B")}.png" alt="">
        <img transition:fade  on:click={(e)=>{document.querySelector(".checkin").src =op5+"/"+reple("E")+".png"}} class="imgC" src="{op5}/{reple("E")}.png" alt="">
        <img transition:fade on:click={(e)=>{document.querySelector(".checkin").src =op5+"/"+reple("F")+".png"}} class="imgC" src="{op5}/{reple("F")}.png" alt=""></div>
        <button on:click = {cart1.push(op5+"/"+much),cart2.push(boxBelow),console.log(cart1,cart2)}>click me to buy</button>
        <button on:click = {falsy}>Go to cart </button>
    
        <input type=range bind:value={a} min=6 max=18 step=2>
        {#if values[(a-6)/2] ===1}
        <p class="green" >UK Size:{a} </p>
        {:else}
        <p class="red" >UK Size:{a} (Out of stock) </p>
        {/if}

        <!-- <button type="button" class="btn btn-primary black" on:click={addToCart}>Add to cart</button> -->
    </div>
<div>

    
</div>

</div>
{:else}


<div transition:fade  class="start"><img transition:fade class="checkin" src="{op2}/{much}.png" alt="">
    <div transition:fade  class="contentPic">{@html boxBelow} <div  transition:fade class="smallFlex">
<img on:click={(e)=>{document.querySelector(".checkin").src =op2+"/"+reple("B")+".png"}} class="imgC" src="{op2}/{reple("B")}.png" alt="">
        <img transition:fade  on:click={(e)=>{document.querySelector(".checkin").src =op2+"/"+reple("E")+".png"}} class="imgC" src="{op2}/{reple("E")}.png" alt="">
        <img transition:fade on:click={(e)=>{document.querySelector(".checkin").src =op2+"/"+reple("F")+".png"}} class="imgC" src="{op2}/{reple("F")}.png" alt=""></div>
        <button on:click = {cart1.push(op2+"/"+much),cart2.push(boxBelow),console.log(cart1,cart2)}>click me to buy</button>
    <button on:click = {falsy}>Go to cart </button>
        <input type=range bind:value={a} min=6 max=18 step=2>
        {#if values[(a-6)/2] ===1}
        <p class="green" >UK Size:{a} </p>
        {:else}
        <p class="red" >UK Size:{a} (Out of stock) </p>
        {/if}
    </div>
<div>

    
</div>

</div>

{/if}
<div class="div"></div>

{:else}
<Carts much ={much} op2 ={op2} ko={ko} boxBelow = {boxBelow} op4 = {op4} op5={op5} cart1 ={cart1} cart2 = {cart2}/>
{/if}
 


<style>

    .green{
        color:green;
    }

    .red{color:red}
    .checkin{
width:52rem;

    }
    .smallFlex{
justify-content: space-evenly;
        display:flex;
        flex-wrap: wrap;
    }
    .start {
        display:flex;
    }

.imgC{
padding:1rem;
border-radius: 90%;
width:12rem;
}
    
.contentPic{
  display:flex;
  flex-direction: column;
  text-align: center;
  font-size: 1.2rem;
  border: solid 1px grey;
  padding: 2rem;
}

.mark1{
    text-transform: uppercase;
   font-weight: bold;
}

.mark2{
font-weight: lighter;
font-style: italic;

}

.mark3{
    text-align: center;
    color:red;
}

    .flex-col{
   
     margin: 1rem;
    }


</style>