'use strict'

$ ->

  el = document.body
  isOpen = location.hash is '#open'

  _animate = ->
    setTimeout(->
      $('.cover').addClass 'animated'
    , 1000)

  _expand = (options)->
    $('main, .cover, .link-item').toggleClass 'expanded'
    $('.fitbit').toggle()
    $('.avatar').toggle()
    Uno.search.form options.form

  $('#blog-button, #avatar-link').click ->
    return $('#menu-button').trigger 'click' unless Uno.is 'device', 'desktop'
    _expand form: 'toggle'

  $("#menu-button").click ->
    $('main, .cover, #menu-button').toggleClass 'expanded'
    $('.fitbit').toggle()
    $('.avatar').toggle()
    if (Uno.is 'device', 'mobile') or (Uno.is 'device', 'tablet')
      $('.fitbit').hide()
      $('.avatar').show()


  if (Uno.is 'device', 'desktop') and (Uno.is 'page', 'home')
    _animate()
    _expand form: 'hide' if !isOpen

