#!/usr/bin/env ruby
require 'ostruct'
require 'optparse'
require 'rest-client'
require 'json'
# require 'Base64'

project = 'meninx-project'

database = RestClient::Resource.new('http://localhost:3000/' + project)


def fixPeriodValues(database)

	begin
		response = database['_find'].post({ 'selector' =>
		    { 'resource.type'=> { '$eq' => 'Trench' } } }.to_json, :content_type => :json, :accept => :json)

		documents = JSON.parse(response, :symbolize_names => true)[:docs]

		puts 'documents: ' + documents.length.to_s

		for document in documents
            puts "--"
            puts document[:resource][:identifier]
            puts document[:resource][:type]
            puts document[:resource][:relations]
            document[:resource][:relations][:isRecordedIn] = []

            puts document[:resource][:relations]

            addModifiedEntry(document)
            # saveChanges(document, database)
		end

	rescue RestClient::Exception => e
	  	puts 'ERROR: Find failed'
	  	exit(1)
	end
end


def addModifiedEntry(document)

	document[:modified] << { 'user': 'Script DAI-IT', 'date': Time.now.strftime('%Y-%m-%dT%H:%M:%S.%LZ') }
end


def saveChanges(document, database)

	begin
		database[document[:_id]].put(document.to_json, :content_type => :json, :accept => :json)
		puts 'Fixed document ' + document[:_id]
	rescue RestClient::Exception => e
	  	puts 'ERROR: Put failed for document ' + document[:_id]
	  	exit(1)
	end
end

fixPeriodValues(database)