const core = require('@actions/core')
const aws = require('aws-sdk')
const fs = require('fs')

const outputPath = core.getInput('OUTPUT_PATH')
const outputFormat = core.getInput('OUTPUT_FORMAT')
const secretName = core.getInput('SECRET_NAME')
const secretsManager = new aws.SecretsManager({
  accessKeyId: core.getInput('AWS_ACCESS_KEY_ID'),
  secretAccessKey: core.getInput('AWS_SECRET_ACCESS_KEY'),
  region: core.getInput('AWS_DEFAULT_REGION')
})

async function getSecretValue (secretsManager, secretName) {
  return secretsManager.getSecretValue({ SecretId: secretName }).promise()
}

getSecretValue(secretsManager, secretName).then(resp => {
  const secret = resp.SecretString

  if (secret) {
    const parsedSecret = JSON.parse(secret)
    Object.entries(parsedSecret).forEach(([key, value]) => {
      core.setSecret(value)
      core.exportVariable(key, value)
    })
    if (outputPath) {
      if (outputFormat === 'raw') {
        fs.writeFileSync(outputPath, secret)
      } else if (outputFormat === 'dotenv') {
        const secretsAsEnv = Object.entries(parsedSecret).map(([key, value]) => `${key}=${value}`).join('\n')
        fs.writeFileSync(outputPath, secretsAsEnv)
      }
    }
  } else {
    core.warning(`${secretName} has no secret values`)
  }
}).catch(err => {
  core.setFailed(err)
})

exports.getSecretValue = getSecretValue
