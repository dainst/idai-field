defmodule FieldHub.IssuesTest do
  alias FieldHub.Project

  alias FieldHub.{
    Issues,
    Issues.Issue,
    TestHelper
  }

  use ExUnit.Case

  @project "test"
  @user_name "test_user"
  @user_password "test_password"

  @project_doc File.read!("test/fixtures/documents/project.json")
  @configuration_doc File.read!("test/fixtures/documents/configuration.json")
  @custom_category_image File.read!("test/fixtures/documents/custom_category_image.json")
  @copyright_image File.read!("test/fixtures/documents/copyright_image.json")

  setup %{} do
    # Run before each tests
    TestHelper.create_complete_example_project(@project, @user_name, @user_password)

    on_exit(fn ->
      # Run after each tests
      TestHelper.remove_complete_example_project(
        @project,
        @user_name
      )
    end)
  end

  test "can evaluate issues for complete project" do
    assert [] = Issues.evaluate_all(@project)
  end

  test "missing project document creates issues" do
    TestHelper.delete_document(@project, "project")

    issues = Issues.evaluate_all(@project)

    assert [
             %FieldHub.Issues.Issue{
               data: %{reason: "Document with id 'project' got deleted at some point."},
               severity: :error,
               type: :no_project_document
             },
             %FieldHub.Issues.Issue{
               data: %{
                 missing: "project",
                 referencing_docs: _
               },
               severity: :error,
               type: :unresolved_relation
             }
           ] = issues
  end

  test "empty list of default map layers raises issue" do
    updated_doc =
      @project_doc
      |> Jason.decode!()
      |> Map.update!("resource", fn resource ->
        Map.update!(resource, "relations", fn relations ->
          Map.put(relations, "hasDefaultMapLayer", [])
        end)
      end)

    TestHelper.update_document(@project, updated_doc)

    assert [
             %FieldHub.Issues.Issue{
               type: :no_default_project_map_layer,
               severity: :info,
               data: %{}
             }
           ] = Issues.evaluate_project_document(@project)
  end

  test "no default map key raises issue" do
    updated_doc =
      @project_doc
      |> Jason.decode!()
      |> Map.update!("resource", fn resource ->
        Map.update!(resource, "relations", fn relations ->
          Map.delete(relations, "hasDefaultMapLayer")
        end)
      end)

    TestHelper.update_document(@project, updated_doc)

    assert [
             %FieldHub.Issues.Issue{
               type: :no_default_project_map_layer,
               severity: :info,
               data: %{}
             }
           ] = Issues.evaluate_project_document(@project)
  end

  test "adding duplicate indentifier raises issue" do
    updated_doc = %{
      resource: %{
        id: "st1-duplicate",
        identifier: "PQ1-ST1"
      },
      _id: "st1-duplicate"
    }

    TestHelper.create_document(@project, updated_doc)

    assert [
             %FieldHub.Issues.Issue{
               data: %{
                 documents: [
                   %{
                     "_id" => "st1",
                     "_rev" => _,
                     "created" => _,
                     "modified" => _,
                     "resource" => %{
                       "geometry" => _,
                       "id" => "st1",
                       "identifier" => "PQ1-ST1",
                       "relations" => _,
                       "shortDescription" => _,
                       "category" => "SurveyUnit"
                     }
                   },
                   %{
                     "_id" => "st1-duplicate",
                     "_rev" => _,
                     "resource" => %{"id" => "st1-duplicate", "identifier" => "PQ1-ST1"}
                   }
                 ],
                 identifier: "PQ1-ST1"
               },
               severity: :error,
               type: :non_unique_identifiers
             }
           ] = Issues.evaluate_identifiers(@project)
  end

  test "unresolveable relations raises issue" do
    TestHelper.delete_document(@project, "sa1")

    assert [
             %FieldHub.Issues.Issue{
               data: %{
                 missing: "sa1",
                 referencing_docs: [
                   %{
                     category: "SurveyUnit",
                     created: %{date: _, user: "sample_data"},
                     identifier: "PQ2",
                     modified: [%{date: _, user: "sample_data"}],
                     uuid: "syu2"
                   },
                   %{
                     category: "SurveyUnit",
                     created: %{date: _, user: "sample_data"},
                     identifier: "PQ1",
                     modified: [%{date: _, user: "sample_data"}],
                     uuid: "syu1"
                   },
                   %{
                     category: "SurveyUnit",
                     created: %{date: _, user: "sample_data"},
                     identifier: "PQ1-ST1",
                     modified: [%{date: _, user: "sample_data"}],
                     uuid: "st1"
                   }
                 ]
               },
               severity: :error,
               type: :unresolved_relation
             }
           ] = Issues.evaluate_relations(@project)
  end

  test "no access file access for project raises issue" do
    not_existing_project = "project_that_does_not_exist"

    assert [
             %FieldHub.Issues.Issue{
               data: %{path: _path},
               severity: :error,
               type: :file_directory_not_found
             }
           ] = Issues.evaluate_images(not_existing_project)
  end

  test "missing image raises issue" do
    root_path = Application.get_env(:field_hub, :file_directory_root)

    File.rm!("#{root_path}/#{@project}/original_images/o25")
    File.rm!("#{root_path}/#{@project}/thumbnail_images/o25")

    issues = Issues.evaluate_images(@project)

    assert [
             %FieldHub.Issues.Issue{
               data: %{
                 created: _created,
                 created_by: "sample_data",
                 file_name: "PE07-So-07_Z001.jpg",
                 file_type: "Drawing",
                 uuid: "o25"
               },
               severity: :warning,
               type: :missing_original_image
             }
           ] = issues
  end

  test "missing image raises issue even if thumbnail is present" do
    root_path = Application.get_env(:field_hub, :file_directory_root)

    File.rm!("#{root_path}/#{@project}/original_images/o25")

    assert File.exists?("#{root_path}/#{@project}/thumbnail_images/o25")

    issues = Issues.evaluate_images(@project)

    assert [
             %FieldHub.Issues.Issue{
               data: %{
                 created: _created,
                 created_by: "sample_data",
                 file_name: "PE07-So-07_Z001.jpg",
                 file_type: "Drawing",
                 uuid: "o25"
               },
               severity: :warning,
               type: :missing_original_image
             }
           ] = issues
  end

  test "missing original image of custom project category raises issue" do
    TestHelper.create_document(@project, Jason.decode!(@configuration_doc))
    TestHelper.create_document(@project, Jason.decode!(@custom_category_image))

    issues = Issues.evaluate_images(@project)

    assert [
             %FieldHub.Issues.Issue{
               type: :missing_original_image,
               severity: :warning,
               data: %{
                 created: _,
                 created_by: "anonymous",
                 file_name: "some_image.jpg",
                 file_type: "Test:SpecialPhoto",
                 uuid: "25c6f27b-7078-449b-80c1-d765fedbfdb2"
               }
             }
           ] = issues
  end

  test "Image with valid copyright does not raise issue" do
    [ok: image] = Project.get_documents(@project, ["o25"])

    TestHelper.update_document(
      @project,
      image
      |> Map.update!("resource", fn resource ->
        Map.delete(resource, "imageRights")
      end)
    )

    assert [
             %FieldHub.Issues.Issue{
               type: :missing_image_copyright,
               severity: :warning,
               data: %{
                 created: _,
                 created_by: "sample_data",
                 file_name: "PE07-So-07_Z001.jpg",
                 file_type: "Drawing",
                 uuid: "o25"
               }
             }
           ] = Issues.evaluate_images(@project)

    TestHelper.update_document(@project, Jason.decode!(@copyright_image))

    assert [] = Issues.evaluate_images(@project)
  end

  test "missing thumbnail raises no issue" do
    root_path = Application.get_env(:field_hub, :file_directory_root)

    File.rm!("#{root_path}/#{@project}/thumbnail_images/o25")

    assert File.exists?("#{root_path}/#{@project}/original_images/o25")

    issues = Issues.evaluate_images(@project)
    assert [] = issues
  end

  test "original and thumbnail image of same size raises issue" do
    root_path = Application.get_env(:field_hub, :file_directory_root)

    File.rm!("#{root_path}/#{@project}/original_images/o25")

    File.cp!(
      "#{root_path}/#{@project}/thumbnail_images/o25",
      "#{root_path}/#{@project}/original_images/o25"
    )

    issues = Issues.evaluate_images(@project)

    assert [
             %FieldHub.Issues.Issue{
               data: %{
                 created: _created,
                 created_by: "sample_data",
                 file_name: "PE07-So-07_Z001.jpg",
                 file_type: "Drawing",
                 uuid: "o25",
                 original_size: 18409,
                 thumbnail_size: 18409
               },
               severity: :info,
               type: :image_variants_size
             }
           ] = issues
  end

  test "sort_issues_by_decreasing_serverity/1" do
    issues =
      [
        %Issue{
          type: :info_level_issue,
          severity: :info,
          data: %{some_info_msg: "Everything is fine, no need to worry."}
        },
        %Issue{
          type: :warning_level_issue,
          severity: :warning,
          data: %{some_warning_msg: "This was probably unintended."}
        },
        %Issue{
          type: :error_level_issue,
          severity: :error,
          data: %{some_error_msg: "ABORT ABORT!"}
        },
        %Issue{
          type: :warning_level_issue,
          severity: :warning,
          data: %{some_warning_msg: "This was probably unintended."}
        },
        %Issue{
          type: :info_level_issue,
          severity: :info,
          data: %{some_info_msg: "Everything is fine, no need to worry."}
        },
        %Issue{
          type: :error_level_issue,
          severity: :error,
          data: %{some_error_msg: "ABORT ABORT!"}
        },
        %Issue{
          type: :info_level_issue,
          severity: :info,
          data: %{some_info_msg: "Everything is fine, no need to worry."}
        },
        %Issue{
          type: :warning_level_issue,
          severity: :warning,
          data: %{some_warning_msg: "This was probably unintended."}
        }
      ]
      |> Issues.sort()

    assert [
             %FieldHub.Issues.Issue{
               type: :error_level_issue,
               severity: :error,
               data: %{some_error_msg: "ABORT ABORT!"}
             },
             %FieldHub.Issues.Issue{
               type: :error_level_issue,
               severity: :error,
               data: %{some_error_msg: "ABORT ABORT!"}
             },
             %FieldHub.Issues.Issue{
               type: :warning_level_issue,
               severity: :warning,
               data: %{some_warning_msg: "This was probably unintended."}
             },
             %FieldHub.Issues.Issue{
               type: :warning_level_issue,
               severity: :warning,
               data: %{some_warning_msg: "This was probably unintended."}
             },
             %FieldHub.Issues.Issue{
               type: :warning_level_issue,
               severity: :warning,
               data: %{some_warning_msg: "This was probably unintended."}
             },
             %FieldHub.Issues.Issue{
               type: :info_level_issue,
               severity: :info,
               data: %{some_info_msg: "Everything is fine, no need to worry."}
             },
             %FieldHub.Issues.Issue{
               type: :info_level_issue,
               severity: :info,
               data: %{some_info_msg: "Everything is fine, no need to worry."}
             },
             %FieldHub.Issues.Issue{
               type: :info_level_issue,
               severity: :info,
               data: %{some_info_msg: "Everything is fine, no need to worry."}
             }
           ] = issues
  end
end
