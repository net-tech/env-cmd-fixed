import { GetEnvVarOptions } from './types'
import { getRCFileVars } from './parse-rc-file'
import { getEnvFileVars } from './parse-env-file'

const RC_FILE_DEFAULT_LOCATIONS = ['./.env-cmdrc', './.env-cmdrc.js', './.env-cmdrc.json']
const ENV_FILE_DEFAULT_LOCATIONS = ['./.env', './.env.js', './.env.json', './stack.env']

export async function getEnvVars (options: GetEnvVarOptions = {}): Promise<{ [key: string]: any }> {
  options.envFile = options.envFile !== undefined ? options.envFile : {}
  // Check for rc file usage
  if (options.rc !== undefined) {
    return await getRCFile({
      environments: options.rc.environments,
      filePath: options.rc.filePath,
      verbose: options.verbose
    })
  }
  return await getEnvFile({
    filePath: options.envFile.filePath,
    fallback: options.envFile.fallback,
    verbose: options.verbose
  })
}

export async function getEnvFile (
  { filePath, fallback, verbose }: { filePath?: string, fallback?: boolean, verbose?: boolean }
): Promise<{ [key: string]: any }> {
  // Use env file
  if (filePath !== undefined) {
    try {
      const env = await getEnvFileVars(filePath)
      if (verbose === true) {
        console.info(`Found .env file at path: ${filePath}`)
      }
      return env
    } catch (e) {
      if (verbose === true) {
        console.info(`Failed to find .env file at path: ${filePath}`)
      }
    }
    if (fallback !== true) {
      throw new Error(`Failed to find .env file at path: ${filePath}`)
    }
  }

  // Use the default env file locations
  for (const path of ENV_FILE_DEFAULT_LOCATIONS) {
    try {
      const env = await getEnvFileVars(path)
      if (verbose === true) {
        console.info(`Found .env file at default path: ${path}`)
      }
      return env
    } catch (e) {
    	if (verbose === true) {
        console.info(`Failed to find .env file at default path: ${path}`)
      }
    }
  }

  const error = `Failed to find .env file at default paths: [${ENV_FILE_DEFAULT_LOCATIONS.join(',')}]`
  if (verbose === true) {
    console.info(error)
  }
  // throw new Error(error)
}

export async function getRCFile (
  { environments, filePath, verbose }: { environments: string[], filePath?: string, verbose?: boolean }
): Promise<{ [key: string]: any }> {
  // User provided an .rc file path
  if (filePath !== undefined) {
    try {
      const env = await getRCFileVars({ environments, filePath })
      if (verbose === true) {
        console.info(`Found environments: [${environments.join(',')}] for .rc file at path: ${filePath}`)
      }
      return env
    } catch (e) {
      if (e.name === 'PathError') {
        if (verbose === true) {
          console.info(`Failed to find .rc file at path: ${filePath}`)
        }
      }
      if (e.name === 'EnvironmentError') {
        if (verbose === true) {
          console.info(`Failed to find environments: [${environments.join(',')}] for .rc file at path: ${filePath}`)
        }
      }
      throw e
    }
  }

  // Use the default .rc file locations
  for (const path of RC_FILE_DEFAULT_LOCATIONS) {
    try {
      const env = await getRCFileVars({ environments, filePath: path })
      if (verbose === true) {
        console.info(`Found environments: [${environments.join(',')}] for default .rc file at path: ${path}`)
      }
      return env
    } catch (e) {
      if (e.name === 'EnvironmentError') {
        const errorText = `Failed to find environments: [${environments.join(',')}] for .rc file at path: ${path}`
        if (verbose === true) {
          console.info(errorText)
        }
        throw new Error(errorText)
      }
    }
  }

  const errorText = `Failed to find .rc file at default paths: [${RC_FILE_DEFAULT_LOCATIONS.join(',')}]`
  if (verbose === true) {
    console.info(errorText)
  }
  throw new Error(errorText)
}
