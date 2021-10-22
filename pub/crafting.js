
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

        await fetch('./data/recipes.json')
            .then(response => response.json())
            .then(data => {
                resourceRecipes = data
            });

        await fetch(`./data/recipes/${skill}_recipes.json`)
            .then(response => response.json())
            .then(data => {
                dynamicRecipes = data
            });

    }catch (e) {}
    app.getAvailableRecipes()
}

getData("","engineering")


var app = new Vue({
    el: '#app',
    data: {
        form:{
            selectedCategorie:"refining",
            selectedJob:"smelting",
            selectedRecipe:null,
            amount:10,
            availableRecipes:[]
        },
        options:{
            categories:["refining","crafting"],
            refining:["smelting","woodworking","leatherworking","weaving","stonecutting"],
            crafting:["arcana","armoring","cooking","engineering","furnishing","jewelcraft","weaponsmithing"],
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
            let allRecipes = Object.values(resourceRecipes).concat(dynamicRecipes)
            if(Object.values(allRecipes).length > 0) {
                let o = []
                Object.values(allRecipes).forEach(recipe => {
                    if (recipe.categorie == this.form.selectedJob) {
                        o.push(JSON.parse(JSON.stringify(recipe)))
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
        if (resources[ing.name].type === "raw") {
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

        let recipe = copy(resourceRecipes)[itemName]
        if(recipe){
            recipe.ingredients.forEach(ing => {
                ing.amount *= amount
                // !!!----RECURSIVE-----!!!
                if(resources[ing.name].type != "raw"){
                    ing["exp"] = resourceRecipes[ing.name].exp * ing.amount
                    ing["craftingFee"] = resourceRecipes[ing.name].craftingFee * ing.amount
                    ing["ingredients"] = getIngredients(ing, ing.amount)
                }else{
                    ing["ingredients"] = []
                }
            })
            allIngredients.push(recipe["ingredients"])
            return recipe.ingredients
        }else{
            allIngredients.push([ingredient])
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

