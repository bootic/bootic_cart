require 'rubygems'
require 'bundler/setup'

require 'jbundle'
require './util/s3_uploader'

task :default => :build

def build(version = nil, rebundle = false)
  JBundle.config_from_file 'JFile'
  JBundle.config.version(version) if version # force version to passed value
  JBundle.write! if rebundle
  return JBundle.config
end

def upload(jbundle_config, config)
  S3Uploader.new(jbundle_config.target_dir, jbundle_config.version, config).upload
end

def s3_creds
  {
    access_key_id: ENV['BOOTIC_S3_KEY'],
    secret_access_key: ENV['BOOTIC_S3_SECRET'],
    bucket: 'bootic_js',
    directory: 'cart'
  }
end

desc 'Bundle and minify source files.'
task :build do
  build nil, true
end

desc 'upload files to s3'
task :upload do
  upload(build(nil, false), s3_creds)
end

desc 'build and upload files to s3'
task :release do
  upload(build(nil, true), s3_creds)
end