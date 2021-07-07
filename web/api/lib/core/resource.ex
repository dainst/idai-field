defmodule Api.Core.Resource do

  def get_parent_id(%{ relations: %{ isChildOf: [%{ resource: %{ id: id } }|_] } }), do: id
  def get_parent_id(_), do: nil

  def get_grandparent_id(%{ relations: %{ isChildOf: [%{ resource: %{ parentId: id } }|_] } }), do: id
  def get_grandparent_id(_), do: nil
end
