using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateLookupRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public List<string> Values { get; set; } = new();
}

public class AddLookupValueRequest
{
    [Required]
    public string Value { get; set; } = string.Empty;

    public int OrderIndex { get; set; }
}

public class LookupValueResponse
{
    public int LookupValueId { get; set; }
    public int LookupId { get; set; }
    public string Value { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}

public class LookupResponse
{
    public int LookupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<LookupValueResponse> Values { get; set; } = new();
}
