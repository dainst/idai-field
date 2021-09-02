defmodule Api.AppTest.RouterTest do
  @moduledoc """
  For these tests, when the api is queried,
  Api.Documents.MockIndexAdapter
  will provide the test data.
  """

  use ExUnit.Case, async: true
  use Plug.Test

  alias Api.AppTest.Support.AppTestHelper
  alias Api.Router
  alias Api.Core.Utils

  @api_path AppTestHelper.api_path
  @documents_path @api_path <> "/documents"
  @map_path @documents_path <> "/map"

  @user1 {"user-1", "pass-1"}

  setup context do
    AppTestHelper.perform_query context
  end

  @tag path: @documents_path <> "/doc-of-proj-a"
  test "get document", context do
    assert context.conn.state == :sent
    assert context.conn.status == 200
    assert context.body.project == "a"
  end

  @tag path: @documents_path <> "/doc-of-proj-b"
  test "do not get document as anonymous user", context do
    assert context.conn.state == :sent
    assert context.conn.status == 401
    assert context.body.error == "unauthorized"
  end

  @tag path: @documents_path <> "/doc-of-proj-b", login: @user1
  test "get document as logged in user", context do
    assert context.conn.state == :sent
    assert context.conn.status == 200
    assert context.body.project == "b"
  end

  @tag path: @documents_path
  test "show multiple documents - only project 'a' documents for anonymous user", context do
    assert length(context.body.documents) == 1
    assert List.first(context.body.documents).project == "a"
  end

  @tag path: @documents_path, login: @user1
  test "show multiple documents - all documents for user-1", context do
    assert length(context.body.documents) == 2
    assert List.first(context.body.documents).project == "a"
    assert List.last(context.body.documents).project == "b"
  end

  @tag path: @map_path
  test "show geometries - only project 'a' documents for anonymous user", context do
    assert length(context.body.documents) == 1
    assert List.first(context.body.documents).project == "a"
  end

  @tag path: @map_path, login: @user1
  test "show geometries - all documents for user-1", context do
    assert length(context.body.documents) == 2
    assert List.first(context.body.documents).project == "a"
    assert List.last(context.body.documents).project == "b"
  end
end
