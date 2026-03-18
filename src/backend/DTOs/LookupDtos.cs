using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateLookupValueItem
{
    [Required]
    public string Value { get; set; } = string.Empty;
    public string? ValueAr { get; set; }
}

public class CreateLookupRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? NameAr { get; set; }

    public List<CreateLookupValueItem> Values { get; set; } = new();
}

public class UpdateLookupNameRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
}

public class UpdateLookupValueRequest
{
    public string? ValueAr { get; set; }
}

public class AddLookupValueRequest
{
    [Required]
    public string Value { get; set; } = string.Empty;

    public string? ValueAr { get; set; }

    public int OrderIndex { get; set; }
}

public class LookupValueResponse
{
    public int LookupValueId { get; set; }
    public int LookupId { get; set; }
    public string Value { get; set; } = string.Empty;
    public string? ValueAr { get; set; }
    public int OrderIndex { get; set; }
}

public class LookupResponse
{
    public int LookupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public List<LookupValueResponse> Values { get; set; } = new();
}
