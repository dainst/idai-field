defmodule Api.Auth.RightsTest do
  use ExUnit.Case
  import Api.Auth.Rights

  @anonymous "anonymous"

  @users [
    %{ name: "user-1", pass: "pass-1" },
    %{ name: "user-2", pass: "pass-2" },
  ]

  test "known user" do
    response = authorize(%{ name: "user-1", pass: "pass-1" }, %{ users: @users })
    assert response[:token] != nil
    assert response[:is_admin] == false
    assert response[:info] == nil
  end

  test "unknown user" do
    response = authorize(%{ name: "user-7", pass: "pass-1" }, %{ users: @users })
    assert response[:token] == nil
    assert response[:is_admin] == nil
    assert response[:info] == :not_found
  end
  
  test "wrong pass" do
    response = authorize(%{ name: "user-1", pass: "pass-2" }, %{ users: @users })
    assert response[:token] == nil
    assert response[:is_admin] == nil
    assert response[:info] == :not_found
  end

  test "known user - admin false" do
    response = authorize(%{ name: "user-1", pass: "pass-1" }, %{ users: [%{ name: "user-1", pass: "pass-1", admin: false }]})
    assert response[:token] != nil
    assert response[:is_admin] == false
    assert response[:info] == nil
  end

  test "known user - admin true" do
    response = authorize(%{ name: "user-1", pass: "pass-1" }, %{ users: [%{ name: "user-1", pass: "pass-1", admin: true }]})
    assert response[:token] != nil
    assert response[:is_admin] == true
    assert response[:info] == nil
  end

  test "anonymous" do
    response = authorize(%{ name: @anonymous }, %{ users: []})
    assert response[:token] == nil
    assert response[:is_admin] == false
    assert response[:info] == nil
  end

  test "anonymous - admin nil" do
    response = authorize(%{ name: @anonymous }, %{ users: [%{ name: @anonymous }]})
    assert response[:token] == nil
    assert response[:is_admin] == false
    assert response[:info] == nil
  end

  test "anonymous - admin false" do
    response = authorize(%{ name: @anonymous }, %{ users: [%{ name: @anonymous, admin: false }]})
    assert response[:token] == nil
    assert response[:is_admin] == false
    assert response[:info] == nil
  end

  test "anonymous - admin true" do
    response = authorize(%{ name: @anonymous }, %{ users: [%{ name: @anonymous, admin: true }]})
    assert response[:token] == nil
    assert response[:is_admin] == true
    assert response[:info] == nil
  end

  test "anonymous - misspelled" do
    response = authorize(%{ name: "anonymos" }, %{ users: []})
    assert response[:token] == nil
    assert response[:is_admin] == nil
    assert response[:info] == :not_found
  end

  test "anonymous - password given" do
    response = authorize(%{ name: @anonymous, pass: "abc" }, %{ users: []})
    assert response[:token] == nil
    assert response[:is_admin] == nil
    assert response[:info] == :not_found
  end
end
