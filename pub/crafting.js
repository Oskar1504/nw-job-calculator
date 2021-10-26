
let dynamicRecipes = [],
    resourceRecipes = [],
    resources = [],
    allIngredients = []

async function getData(categorie, skill){
    try {
        console.log("reading data")
        await fetch("./data/resources.json")
            .then(response => response.json())
            .then(data => resources = data);

        let refcats = ["Smelting","Woodworking","Leatherworking","Weaving","Stonecutting"]
        resourceRecipes = []
        for( let refcat of refcats){

            await fetch(`./data/recipes/refining/${refcat}.json`)
                .then(response => response.json())
                .then(data => {
                    // reverse so lowes recipe on top
                    data = Object.fromEntries(Object.entries(data).reverse())
                    // adds recipes togehter
                    resourceRecipes = Object.assign({}, resourceRecipes, data)
                });
        }

        await fetch(`./data/recipes/crafting/${skill}.json`)
            .then(response => response.json())
            .then(data => {
                //reverse so iron is on top
                dynamicRecipes = Object.fromEntries(Object.entries(data).reverse())
            });

    }catch (e) {}
    app.getAvailableRecipes()
}

getData("","Engineering")


var app = new Vue({
    el: '#app',
    data: {
        form:{
            selectedCategorie:"refining",
            selectedJob:"Smelting",
            selectedRecipe:null,
            amount:10,
            availableRecipes:[]
        },
        options:{
            categories:["refining","crafting"],
            refining:["Smelting","Woodworking","Leatherworking","Weaving","Stonecutting"],
            crafting:["Arcana","Armoring","Cooking","Engineering","Furnishing","Jewelcraft","Weaponsmithing"],
        },
        history:{
            keys:[],
            selectedList:""
        }
    },
    computed:{
        stats:function () {
            let rawResources = [],
                craftingTree = [],
                totalFee = 0,
                totalExp = 0,
                totals = [],
                recipe = this.form.selectedRecipe

            if(recipe){
                craftingTree = getCraftingTree(copy(recipe), this.form.amount)
                totals = getTotals(craftingTree ,this.form.selectedRecipe, this.form.amount)
                rawResources = getRawItems()
                totalFee = totals[0]
                totalExp = totals[1]
            }

            return {
                rawResources: rawResources,
                totalFee: totalFee,
                totalExp: totalExp,
                craftingTree: craftingTree
            }
        }
    },
    created(){
        this.updateHistory()
    },
    methods: {
        updateData: function () {
            getData(this.form.selectedCategorie, this.form.selectedJob)
        },
        getAvailableRecipes:function (){
            let allRecipes = Object.values(resourceRecipes).concat(Object.values(dynamicRecipes))
            if(Object.values(allRecipes).length > 0) {
                let o = []
                Object.values(allRecipes).forEach(recipe => {
                    if (recipe.categorie == this.form.selectedJob) {
                        o.push(copy(recipe))
                    }
                })
                this.form.availableRecipes = o
            }
        },
        deformat: function (number) {
            return new Intl.NumberFormat('de-DE').format(number)
        },
        saveHistory: function () {
            let key = `cf_${this.form.selectedJob}_${this.form.selectedRecipe.name}`
            localStorage.setItem(key,JSON.stringify(this.form))
            this.updateHistory()
        },
        updateHistory: function () {
            let o = []
            Object.keys(localStorage).forEach(key => {
                if(key.includes("_") && key.includes("cf")){
                    o.push(key)
                }
            })
            this.history.keys = o
        },
        removeHistory:function () {
            localStorage.removeItem(this.history.selectedList)
            this.updateHistory()
        },
        loadHistory: function () {
            this.form = JSON.parse(localStorage.getItem(this.history.selectedList))
            getData(this.form.selectedCategorie, this.form.selectedJob)
        },
        getDetails: function (ingredient) {
            let o = ""
            if(ingredient.craftingFee){
                o +=` | Crafting cost: ${(ingredient.craftingFee/100).toFixed(2)}`
            }
            if(ingredient.exp){
                o +=` | Experience: ${this.deformat(ingredient.exp)}`
            }
            return o
        }
    }
})

function getTotals(recipes, mainr, amount){
    let exp = 0, fee = 0
    // add first level recipes values
    recipes.forEach(ing => {
        fee += ing.craftingFee
        exp += ing.exp
    })
    //add all nested recipe values
    allIngredients.flat(1).forEach(ing => {
        if(ing.exp){exp += ing.exp }
        if(ing.craftingFee){fee += ing.craftingFee }
    })

    //add main recipe values
    if(mainr.exp){exp += mainr.exp * amount}
    if(mainr.craftingFee){fee += mainr.craftingFee * amount}
    return [fee, exp]
}

function getRawItems(){
    let o = {},
        //flat array to just on earray
        ingredients = allIngredients.flat(1)

    ingredients.forEach(ing => {
        if(resources[ing.name]){
            if (resources[ing.name].type === "raw") {
                if(o[ing.name]){
                    o[ing.name].amount += ing.amount
                }else{
                    o[ing.name] = copy(ing)
                }
            }
        }else{
            if(o[ing.name]){
                o[ing.name].amount += ing.amount
            }else{
                o[ing.name] = copy(ing)
            }
        }
    })
    // reform and sort to array since object structe used to merge efficient
    let l = Object.values(o)
    l.sort(function (a, b) {
        return b.amount - a.amount;
    });
    return l
}

function getCraftingTree(recipe, amount){
    allIngredients = []
    let output = [],
        ingredients = recipe.ingredients


    ingredients.forEach(ingredient => {
        let exp = 0,
            totalFee = 0

        ingredient.amount *= amount
        try{
            if(resources[ingredient.name].type != "raw"){
                if(resourceRecipes[ingredient.name]){
                    exp = resourceRecipes[ingredient.name].exp * ingredient.amount
                    totalFee = resourceRecipes[ingredient.name].craftingFee * ingredient.amount
                }
            }

            output.push({
                name:ingredient.name,
                amount: ingredient.amount ,
                exp: exp,
                craftingFee:totalFee,
                ingredients: getIngredients(ingredient, ingredient.amount )
            })
        }
        catch (e) {
            let obj ={
                name:ingredient.name + " (work in progress)",
                amount: ingredient.amount ,
                exp: 0,
                craftingFee:0,
                ingredients: []
            }
            output.push(obj)
            allIngredients.push(obj)
            console.warn("error while processing: ", ingredient.name)
        }
    })
    r_count = 0
    return output
}

let r_count = 0
function getIngredients(ingredient, amount= 1){
    let itemName = ingredient.name
    if(r_count < 25){
        r_count ++
        console.info("RECURSION COUNT:" , r_count)
        try {
            let recipe = copy(resourceRecipes)[itemName]
            if (recipe) {
                recipe.ingredients.forEach(ing => {
                    ing.amount *= amount
                    // !!!----RECURSIVE-----!!!
                    // console.log(ing.name, resources[ing.name].type) // oftne used DEBUG
                    if (resources[ing.name].type != "raw") {
                        ing["exp"] = resourceRecipes[ing.name].exp * ing.amount
                        ing["craftingFee"] = resourceRecipes[ing.name].craftingFee * ing.amount
                        ing["ingredients"] = getIngredients(ing, ing.amount)
                    } else {
                        ing["ingredients"] = []
                    }
                })
                allIngredients.push(recipe["ingredients"])
                return recipe.ingredients
            } else {
                allIngredients.push([ingredient])
                return []
            }
        }
        catch (e) {
            r_count = 0
            console.warn("error while ", itemName)
            return []
        }
    }
    console.warn("TO MUCH RECURSION. FUNCTION STOPPED. R_COUNT:", r_count)
    console.warn("Stopped by child item:", itemName)
    r_count = 0
    return []
}

function copy(obj){
    return JSON.parse(JSON.stringify(obj))
}


