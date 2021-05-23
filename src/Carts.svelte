
<script>
import { fade } from 'svelte/transition';

import CheckoutItem from './CheckoutItem.svelte';
import Firms from './firms.svelte';
import Nav from './Nav.svelte';
import Outer from './Outer.svelte';
import Page from './page.svelte';
import App from "./App.svelte"
export let much
export let op2
export let boxBelow
export let op5
export let ko   ///PRICE FOR AN ITEM 
export let op4
export let cart1 
export let cart2

function reple(e){

return op4 = much.replace(/.$/,e)
}
console.log(op2 +"op2")
console.log(ko);
console.log(op4 +"op4")
console.log(op5 +"op5")
console.log(much +"much")

function add(a,b){
a[b] += 1

}

function che(a){
    console.log(cart1)
    console.log(doz[0]);
    console.log([...s]);
console.log(a);
    console.log(mush)
    console.log(doz[0].indexOf(a));
}

function cho(item)
{
    
    console.log(item)

console.log(mush[item])
return mush[item] = mush[item] +1;
}

function choz(item)
{
    
    console.log(item)

console.log(mush[item])
return mush[item] = mush[item] -1;
}


const s = new Set(cart1);
console.log(s);

let uniqueCount = ["a","b","c","d","d","e","a","b","c","f","g","h","h","h","e","a"];
let count = {};
cart1.forEach(function(i) { count[i] = (count[i]||0) + 1;});


console.log(Object.values(count));
$: mush = Object.values(count);

let doz =[]
doz.push([...s]);
console.log(doz)
$: doz = doz 

</script>
<div class="flex">
{#if op5 !== "empty4"}
{#each [...s] as item}

<div transition:fade  class="start"><img transition:fade class="checkin" src="{item}.png" alt="">
    <div transition:fade  class="contentPic">{@html cart2[cart1.indexOf(item)]} 
        <div class="numbers"><button class="add" on:click = {cho(doz[0].indexOf(item))}>+</button>
        {mush[doz[0].indexOf(item)]}<button class="remove" on:click = {choz(doz[0].indexOf(item))}> - </button></div>
        </div>
</div>
{/each}

{:else}
{#each [...s] as item}

<div transition:fade  class="start"><img transition:fade class="checkin" src="{item}.png" alt="">
    <div transition:fade  class="contentPic">{@html cart2[cart1.indexOf(item)]} 
        <div class="numbers"><button class="add" on:click = {cho(doz[0].indexOf(item))}>+</button>
        {mush[doz[0].indexOf(item)]}<button class="remove" on:click = {choz(doz[0].indexOf(item))}> - </button></div>
        </div>
</div>
{/each}

{/if}
</div>
<div class="checkOut"> <button class="finalBuy"> Buy products</button></div>
        <style>


.flex {

    display: flex;
    justify-content: space-evenly;
    flex-direction: column;
     margin:1rem;
}


.start{
    border:solid 1px black;
    text-align: left;
}
.checkin{
    width:5rem;
    text-align: left;
}

.smallFlex {

    width:2rem;
}

.contentPic{
    text-align: left;
padding:1rem;

}

.mark3{text-align: right;}

.mark2{
     max-width: 100rem;
}
        </style>