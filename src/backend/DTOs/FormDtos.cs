using System.ComponentModel.DataAnnotations;

namespace FormBuilder.DTOs;

public class CreateFormRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;
}

public class UpdateFormRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;
}

public class FormResponse
{
    public int FormId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? ActiveVersionId { get; set; }
    public DateTime CreatedAt { get; set; }
}
