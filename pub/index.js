
let skillLevel = [],
    resourceRecipes = []

async function getSkillLevel(name){
    
    try {
        await fetch("/data/jobs/" + name + '.json')
            .then(response => response.json())
            .then(data => skillLevel = data);

        await fetch("/data/recipes/" + name + '_recipes.json')
            .then(response => response.json())
            .then(data => app._data.recipes = data)
            .catch(error => app._data.recipes = [])

        await fetch('/data/recipes.json')
            .then(response => response.json())
            .then(data => resourceRecipes = data);
    }catch (e) {
        
    }

    app._data.form.startLevel += 1
    app._data.form.startLevel -= 1
}

getSkillLevel("engineering")


var app = new Vue({
    el: '#app',
    data: {
        form:{
            startLevel:1,
            targetLevel:50,
            selectedJob:"engineering",
            recipe:1
        },
        recipes: [],
        availableJobs:["arcana","armoring","cooking","engineering","furnishing","jewelcraft","weaponsmithing"],
    },
    computed:{
        stats:function(){
            let expNeeded = this.calculateExperience(),
                craftingAmount = Math.ceil(expNeeded/this.form.recipe.experience),
                rawResources = {},
                ingredients = this.form.recipe.ingredients
            if(ingredients){

                ingredients.forEach(ingredient => {
                    let raw = getRawItems(ingredient)
                    raw.forEach( item2 => {
                        // deep copy item
                        let item = JSON.parse(JSON.stringify(item2))
                        item.amount *= ingredient.amount
                        if(rawResources[item.name]){
                            rawResources[item.name].amount += item.amount
                        }else{
                            rawResources[item.name] = JSON.parse(JSON.stringify(item))
                        }
                    })
                })

                rawResources = Object.values(rawResources)
            }


            return {
                rawResources:rawResources,
                expNeeded:expNeeded,
                craftingAmount: craftingAmount
            }
        }
    },
    methods: {
        calculateRawResources: function (ingredient) {
            let o = ingredient.amount
            if(!ingredient.name.includes("raw")){
                o = ingredient.amount * (Math.pow(4, ingredient.selectedTier))
            }
            return o
        },
        calculateExperience: function () {
            let o = 0,
                start = this.form.startLevel,
                end = this.form.targetLevel,
                startExp = 0,
                targetExp = 0

            skillLevel.forEach(level => {
                if(level.level == start){
                    startExp = parseInt(level["exp (total)"])
                }

                if(level.level == end){
                    targetExp = parseInt(level["exp (total)"].replace(",",""))
                }
            })
            o = targetExp - startExp
            return o
        }
    }
})

function getRawItems(ingredient){
    let o = []
    resourceRecipes.forEach( recipe => {
        if(recipe.name === ingredient.selectedItem){
            o =  recipe.rawResources
        }
    })
    return o
}
