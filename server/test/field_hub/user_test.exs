defmodule FieldHub.UserTest do
  alias FieldHub.User

  use ExUnit.Case

  @user_name "test_user"
  @user_password "test_password"

  setup %{} do
    on_exit(fn ->
      User.delete(@user_name)
    end)
  end

  test "exists?/1 correctly returns false" do
    assert false == User.user_exists?(@user_name)
  end

  test "can create user" do
    assert :created = User.create(@user_name, @user_password)
  end

  test "can delete user" do
    assert :created = User.create(@user_name, @user_password)
    assert :deleted = User.delete(@user_name)
  end

  test "trying to recreate user is reported" do
    assert :created = User.create(@user_name, @user_password)
    assert :already_exists = User.create(@user_name, @user_password)
  end

  test "trying to delete an unknown user is reported" do
    assert :unknown = User.delete(@user_name)
  end

  describe "Manipulating an existing user" do
    setup %{} do
      User.create(@user_name, @user_password)
      :ok
    end

    test "exists?/1 correctly returns true" do
      assert true == User.user_exists?(@user_name)
    end

    test "can update user password" do
      assert :updated = User.update_password(@user_name, "new_password")
    end

    test "trying to update password of an unknown user is reported" do
      assert :unknown = User.update_password("unknown_user", "new_password")
    end
  end
end
