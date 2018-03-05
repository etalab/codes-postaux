/* eslint unicorn/no-process-exit: off */
const request = require('superagent')
const {chain, difference, groupBy} = require('lodash')
const {getIndexedCommunes} = require('./build/cog')

const LAPOSTE_DATASET_URL = 'https://datanova.legroupe.laposte.fr/explore/dataset/laposte_hexasmal/download/?format=json'

async function loadLaPosteDataset() {
  const response = await request.get(LAPOSTE_DATASET_URL)
  return response.body
    .map(({fields}) => ({
      codePostal: fields.code_postal,
      libelleAcheminement: fields.libell_d_acheminement,
      nomCommuneAFNOR: fields.nom_de_la_commune,
      codeCommune: fields.code_commune_insee,
      ligne5: fields.ligne_5
    }))
}

async function loadCompactDataset() {
  return require('./codes-postaux.json')
}

const MLP = ['13055', '69123', '75056']

function getCodeCommuneStatus(codeCommune, communes) {
  if (codeCommune.startsWith('98') || codeCommune.startsWith('975') || codeCommune.startsWith('977') || codeCommune.startsWith('978')) return 'COM'
  if (codeCommune === '99138') return 'Monaco'
  if (!(codeCommune in communes)) return 'commune inconnue'
  const commune = communes[codeCommune]
  return commune.status === '1' ? 'commune actuelle' : 'commune ancienne'
}

async function printMeta(dataset, communes) {
  console.log(` - Nombre d'entrées : ${dataset.length}`)
  console.log(` - Nombre de codes postaux : ${chain(dataset).map('codePostal').uniq().compact().value().length}`)

  const codesCommunes = chain(dataset)
    .map('codeCommune')
    .uniq()
    .compact()
    .map(codeCommune => ({codeCommune, status: getCodeCommuneStatus(codeCommune, communes)}))
    .value()
  console.log(` - Nombre de codes communes : ${codesCommunes.length}`)
  const groupedCodesCommunes = groupBy(codesCommunes, 'status')
  Object.keys(groupedCodesCommunes).forEach(status => {
    console.log(`      dont ${groupedCodesCommunes[status].length} ${status}`)
  })
  if ('commune inconnue' in groupedCodesCommunes) {
    console.log(`      Communes inconnues : ${groupedCodesCommunes['commune inconnue'].map(e => e.codeCommune).join(', ')}`)
  }

  const codesActuels = Object.keys(communes).filter(codeCommune => ['1', '5'].includes(communes[codeCommune].status))
  const codesActuelsSansCp = difference(codesActuels, codesCommunes.map(e => e.codeCommune), MLP)
  console.log(` - Nombre de communes actuelles sans code postal : ${codesActuelsSansCp.length}`)
  if (codesActuelsSansCp.length > 0) {
    console.log(`   ${codesActuelsSansCp.join(', ')}`)
  }
  console.log(` - Nombre d'entrées sans code commune : ${dataset.filter(e => !e.codeCommune).length}`)
  console.log(` - Nombre d'entrées sans code postal : ${dataset.filter(e => !e.codePostal).length}`)
  console.log()
}

async function compareCodesCommunes(lp, compact, communes) {
  const codesCommunesLaPoste = chain(lp).map(e => e.codeCommune).uniq().value()
  const codesCommunesCompact = chain(compact).map(e => e.codeCommune).uniq().value()

  const codesCommunesNotInCompact = difference(codesCommunesLaPoste, codesCommunesCompact)
  console.log('Les codes communes suivants sont présents uniquement dans le fichier de La Poste :')
  codesCommunesNotInCompact.forEach(cp => console.log(`  - ${cp} (${getCodeCommuneStatus(cp, communes)})`))

  const codesCommunesNotInLaPoste = difference(codesCommunesCompact, codesCommunesLaPoste)
  console.log('Les codes communes suivants sont présents uniquement dans le fichier local :')
  codesCommunesNotInLaPoste.forEach(cp => console.log(`  - ${cp} (${getCodeCommuneStatus(cp, communes)})`))
}

async function compareCodesPostaux(lp, compact) {
  const codesPostauxLaPoste = chain(lp).map(e => e.codePostal).uniq().value()
  const codesPostauxCompact = chain(compact).map(e => e.codePostal).uniq().value()

  const codesPostauxNotInCompact = difference(codesPostauxLaPoste, codesPostauxCompact)
  console.log('Les codes postaux suivants sont présents uniquement dans le fichier de La Poste :')
  codesPostauxNotInCompact.forEach(cp => console.log(`  - ${cp}`))

  const codesPostauxNotInLaPoste = difference(codesPostauxCompact, codesPostauxLaPoste)
  console.log('Les codes postaux suivants sont présents uniquement dans le fichier local :')
  codesPostauxNotInLaPoste.forEach(cp => console.log(`  - ${cp}`))
}

async function doStuff() {
  const lp = await loadLaPosteDataset()
  const compact = await loadCompactDataset()
  const communes = await getIndexedCommunes()

  console.log('Données concernant le fichier local :')
  await printMeta(compact, communes)

  console.log('Données concernant le fichier de La Poste :')
  await printMeta(lp, communes)

  await compareCodesCommunes(lp, compact, communes)
  console.log()
  await compareCodesPostaux(lp, compact)
  console.log()
}

doStuff().catch(err => {
  console.error(err)
  process.exit(1)
})
